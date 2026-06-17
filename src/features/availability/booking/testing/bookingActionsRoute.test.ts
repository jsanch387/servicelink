import { POST } from '@/app/api/availability/bookings/[id]/actions/route';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getAuthenticatedUserMock,
  assertOwnerSmsSendRateLimitsMock,
  sendAndRecordSmsMock,
  createSupabaseAdminClientMock,
  completeBookingWithSideEffectsMock,
} = vi.hoisted(() => ({
  getAuthenticatedUserMock: vi.fn(),
  assertOwnerSmsSendRateLimitsMock: vi.fn(),
  sendAndRecordSmsMock: vi.fn(),
  createSupabaseAdminClientMock: vi.fn(),
  completeBookingWithSideEffectsMock: vi.fn(),
}));

vi.mock('@/libs/api/getAuthenticatedUser', () => ({
  getAuthenticatedUser: getAuthenticatedUserMock,
}));

vi.mock('@/server/rateLimit/ownerSmsSendRateLimit', () => ({
  assertOwnerSmsSendRateLimits: assertOwnerSmsSendRateLimitsMock,
}));

vi.mock('@/libs/supabase/admin', () => ({
  createSupabaseAdminClient: createSupabaseAdminClientMock,
}));

vi.mock(
  '@/features/availability/services/completeBookingWithSideEffects',
  () => ({
    completeBookingWithSideEffects: completeBookingWithSideEffectsMock,
  })
);

// Keep the real registry + message builders; only the send orchestrator is mocked.
vi.mock('@/features/sms', async importOriginal => {
  const actual = await importOriginal<typeof import('@/features/sms')>();
  return { ...actual, sendAndRecordSms: sendAndRecordSmsMock };
});

interface BookingRow {
  id: string;
  business_id: string;
  status: string | null;
  job_status: string | null;
  customer_phone: string | null;
}

interface SupabaseConfig {
  business?: { id: string; business_name: string | null } | null;
  booking?: BookingRow | null;
  /** Row returned by the race-safe job_status UPDATE (null = race lost). */
  transition?: { job_status: string } | null;
}

function makeSupabase(config: SupabaseConfig) {
  const transition =
    'transition' in config ? config.transition : { job_status: 'unset' };
  return {
    from: vi.fn((table: string) => {
      if (table === 'business_profiles') {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: config.business ?? null,
                  error: config.business ? null : { message: 'not found' },
                }),
            }),
          }),
        };
      }
      // bookings: supports both SELECT (...maybeSingle) and the UPDATE chain
      // (.update().eq().eq().in().select().maybeSingle()).
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({ data: config.booking ?? null, error: null }),
          }),
        }),
        update: () => ({
          eq: () => ({
            eq: () => ({
              in: () => ({
                select: () => ({
                  maybeSingle: () =>
                    Promise.resolve({ data: transition, error: null }),
                }),
              }),
            }),
          }),
        }),
      };
    }),
  };
}

function authOk(supabase: unknown) {
  return { user: { id: 'owner-1' }, supabase, authMethod: 'bearer' as const };
}

function postRequest(action?: string): NextRequest {
  return new NextRequest(
    'http://localhost/api/availability/bookings/booking-1/actions',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: action === undefined ? undefined : JSON.stringify({ action }),
    }
  );
}

function params(id = 'booking-1') {
  return { params: Promise.resolve({ id }) };
}

const business = { id: 'biz-1', business_name: 'Black Label Detail' };
const baseBooking: BookingRow = {
  id: 'booking-1',
  business_id: 'biz-1',
  status: 'confirmed',
  job_status: 'not_started',
  customer_phone: '5807545207',
};

beforeEach(() => {
  vi.clearAllMocks();
  assertOwnerSmsSendRateLimitsMock.mockResolvedValue({ ok: true });
  sendAndRecordSmsMock.mockResolvedValue({ sent: true, messageId: 'msg-1' });
  createSupabaseAdminClientMock.mockReturnValue({});
  completeBookingWithSideEffectsMock.mockResolvedValue({
    booking: { id: 'booking-1', status: 'completed' },
    notification: {
      review: {
        requested: true,
        sent: true,
        channel: 'sms',
        inviteId: 'inv-1',
      },
      sms: { sent: true, messageId: 'msg-1' },
    },
  });
});

describe('POST /api/availability/bookings/[id]/actions', () => {
  it('400 when booking id is blank', async () => {
    getAuthenticatedUserMock.mockResolvedValue(authOk(makeSupabase({})));
    const res = await POST(postRequest('on_the_way'), params('   '));
    expect(res.status).toBe(400);
    expect(getAuthenticatedUserMock).not.toHaveBeenCalled();
  });

  it('400 when the action is unknown/missing', async () => {
    getAuthenticatedUserMock.mockResolvedValue(authOk(makeSupabase({})));
    const res = await POST(postRequest('teleport'), params());
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.validActions).toEqual(
      expect.arrayContaining(['on_the_way', 'job_started', 'job_completed'])
    );
    expect(getAuthenticatedUserMock).not.toHaveBeenCalled();
  });

  it('401 when unauthenticated', async () => {
    getAuthenticatedUserMock.mockResolvedValue({
      error: 'Authentication required',
      status: 401,
      code: 'UNAUTHORIZED',
    });
    const res = await POST(postRequest('on_the_way'), params());
    expect(res.status).toBe(401);
    expect(sendAndRecordSmsMock).not.toHaveBeenCalled();
  });

  it('404 when the business profile is missing', async () => {
    getAuthenticatedUserMock.mockResolvedValue(
      authOk(makeSupabase({ business: null }))
    );
    const res = await POST(postRequest('on_the_way'), params());
    expect(res.status).toBe(404);
  });

  it('404 when the booking belongs to another business (ownership)', async () => {
    getAuthenticatedUserMock.mockResolvedValue(
      authOk(
        makeSupabase({
          business,
          booking: { ...baseBooking, business_id: 'other-biz' },
        })
      )
    );
    const res = await POST(postRequest('on_the_way'), params());
    expect(res.status).toBe(404);
    expect(sendAndRecordSmsMock).not.toHaveBeenCalled();
  });

  it('409 when the booking is not confirmed', async () => {
    getAuthenticatedUserMock.mockResolvedValue(
      authOk(
        makeSupabase({
          business,
          booking: { ...baseBooking, status: 'cancelled' },
        })
      )
    );
    const res = await POST(postRequest('on_the_way'), params());
    expect(res.status).toBe(409);
    expect(sendAndRecordSmsMock).not.toHaveBeenCalled();
  });

  it('409 when already in the target state (idempotent no-op)', async () => {
    getAuthenticatedUserMock.mockResolvedValue(
      authOk(
        makeSupabase({
          business,
          booking: { ...baseBooking, job_status: 'on_the_way' },
        })
      )
    );
    const res = await POST(postRequest('on_the_way'), params());
    const json = await res.json();
    expect(res.status).toBe(409);
    expect(json.error).toMatch(/already marked on the way/i);
    expect(sendAndRecordSmsMock).not.toHaveBeenCalled();
  });

  it('409 when the transition is not allowed from the current state', async () => {
    // on_the_way is only allowed from not_started; here we are in_progress.
    getAuthenticatedUserMock.mockResolvedValue(
      authOk(
        makeSupabase({
          business,
          booking: { ...baseBooking, job_status: 'in_progress' },
        })
      )
    );
    const res = await POST(postRequest('on_the_way'), params());
    const json = await res.json();
    expect(res.status).toBe(409);
    expect(json.error).toMatch(/currently in progress/i);
    expect(sendAndRecordSmsMock).not.toHaveBeenCalled();
  });

  it('429 when rate limited, with Retry-After header', async () => {
    assertOwnerSmsSendRateLimitsMock.mockResolvedValue({
      ok: false,
      retryAfterSec: 42,
      reason: 'user',
    });
    getAuthenticatedUserMock.mockResolvedValue(
      authOk(makeSupabase({ business, booking: baseBooking }))
    );
    const res = await POST(postRequest('on_the_way'), params());
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('42');
    expect(sendAndRecordSmsMock).not.toHaveBeenCalled();
  });

  it('200 success: transitions job_status and sends the SMS with a dedupe key', async () => {
    getAuthenticatedUserMock.mockResolvedValue(
      authOk(
        makeSupabase({
          business,
          booking: baseBooking,
          transition: { job_status: 'on_the_way' },
        })
      )
    );
    const res = await POST(postRequest('on_the_way'), params());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.action).toBe('on_the_way');
    expect(json.jobStatus).toBe('on_the_way');
    expect(json.sms).toEqual({ sent: true, messageId: 'msg-1' });
    // on_the_way does NOT complete the booking lifecycle.
    expect(completeBookingWithSideEffectsMock).not.toHaveBeenCalled();
    expect(json.bookingStatus).toBeUndefined();
    expect(sendAndRecordSmsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        businessId: 'biz-1',
        bookingId: 'booking-1',
        type: 'on_the_way',
        to: '5807545207',
        dedupeKey: 'booking-1:on_the_way',
      })
    );
  });

  it('200 job_completed transitions job_status AND completes the booking lifecycle + side effects', async () => {
    getAuthenticatedUserMock.mockResolvedValue(
      authOk(
        makeSupabase({
          business,
          booking: { ...baseBooking, job_status: 'in_progress' },
          transition: { job_status: 'completed' },
        })
      )
    );
    const res = await POST(postRequest('job_completed'), params());
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.jobStatus).toBe('completed');
    // Marks the booking complete via the shared lifecycle helper (status +
    // maintenance + the single SMS-first/email-fallback completion notice),
    // surfacing bookingStatus + the review outcome to the app.
    expect(completeBookingWithSideEffectsMock).toHaveBeenCalledTimes(1);
    expect(completeBookingWithSideEffectsMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      'booking-1',
      expect.objectContaining({ source: 'mobile_api' })
    );
    expect(json.bookingStatus).toBe('completed');
    // The completion notification is owned by the shared helper — the route must
    // NOT also fire a generic action SMS (no double-text).
    expect(sendAndRecordSmsMock).not.toHaveBeenCalled();
    expect(json.sms).toEqual({ sent: true, messageId: 'msg-1' });
    expect(json.review).toEqual({
      requested: true,
      sent: true,
      channel: 'sms',
      inviteId: 'inv-1',
    });
  });

  it('200 job_completed still succeeds (state changed) when the completion SMS fails', async () => {
    completeBookingWithSideEffectsMock.mockResolvedValue({
      booking: { id: 'booking-1', status: 'completed' },
      notification: {
        review: {
          requested: true,
          sent: false,
          channel: 'none',
          inviteId: 'inv-1',
        },
        sms: { sent: false, reason: 'error' },
      },
    });
    getAuthenticatedUserMock.mockResolvedValue(
      authOk(
        makeSupabase({
          business,
          booking: { ...baseBooking, job_status: 'in_progress' },
          transition: { job_status: 'completed' },
        })
      )
    );
    const res = await POST(postRequest('job_completed'), params());
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.jobStatus).toBe('completed');
    expect(json.bookingStatus).toBe('completed');
    expect(completeBookingWithSideEffectsMock).toHaveBeenCalledTimes(1);
    expect(sendAndRecordSmsMock).not.toHaveBeenCalled();
    expect(json.sms).toEqual({ sent: false, reason: 'error' });
  });

  it('200 job_completed reports email-channel review when the customer has no phone', async () => {
    completeBookingWithSideEffectsMock.mockResolvedValue({
      booking: { id: 'booking-1', status: 'completed' },
      notification: {
        review: {
          requested: true,
          sent: true,
          channel: 'email',
          inviteId: 'inv-1',
        },
        // No SMS attempted (emailed instead).
      },
    });
    getAuthenticatedUserMock.mockResolvedValue(
      authOk(
        makeSupabase({
          business,
          booking: {
            ...baseBooking,
            job_status: 'in_progress',
            customer_phone: null,
          },
          transition: { job_status: 'completed' },
        })
      )
    );
    const res = await POST(postRequest('job_completed'), params());
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.review).toEqual({
      requested: true,
      sent: true,
      channel: 'email',
      inviteId: 'inv-1',
    });
    // No SMS was attempted; the SMS field reflects that.
    expect(json.sms).toEqual({ sent: false, reason: 'no_phone' });
  });

  it('409 when the race-safe transition affects no rows (concurrent update)', async () => {
    getAuthenticatedUserMock.mockResolvedValue(
      authOk(makeSupabase({ business, booking: baseBooking, transition: null }))
    );
    const res = await POST(postRequest('on_the_way'), params());
    const json = await res.json();
    expect(res.status).toBe(409);
    expect(json.error).toMatch(/already updated/i);
  });

  it('200 with sms.sent=false when the customer SMS fails (state still changes)', async () => {
    sendAndRecordSmsMock.mockResolvedValue({ sent: false, reason: 'error' });
    getAuthenticatedUserMock.mockResolvedValue(
      authOk(
        makeSupabase({
          business,
          booking: baseBooking,
          transition: { job_status: 'on_the_way' },
        })
      )
    );
    const res = await POST(postRequest('on_the_way'), params());
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.jobStatus).toBe('on_the_way');
    expect(json.sms).toEqual({ sent: false, reason: 'error' });
  });

  it('200 with sms.sent=false when there is no customer phone', async () => {
    sendAndRecordSmsMock.mockResolvedValue({ sent: false, reason: 'no_phone' });
    getAuthenticatedUserMock.mockResolvedValue(
      authOk(
        makeSupabase({
          business,
          booking: { ...baseBooking, customer_phone: null },
          transition: { job_status: 'on_the_way' },
        })
      )
    );
    const res = await POST(postRequest('on_the_way'), params());
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.jobStatus).toBe('on_the_way');
    expect(json.sms).toEqual({ sent: false, reason: 'no_phone' });
  });
});
