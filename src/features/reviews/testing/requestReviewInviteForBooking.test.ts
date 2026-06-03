import { requestReviewInviteForBooking } from '../server/requestReviewInviteForBooking';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createReviewInviteIfEligibleMock, createSupabaseAdminClientMock } =
  vi.hoisted(() => ({
    createReviewInviteIfEligibleMock: vi.fn(),
    createSupabaseAdminClientMock: vi.fn(),
  }));

vi.mock('../server/createReviewInviteIfEligible', () => ({
  createReviewInviteIfEligible: createReviewInviteIfEligibleMock,
}));

vi.mock('@/libs/supabase/admin', () => ({
  createSupabaseAdminClient: createSupabaseAdminClientMock,
}));

function mockOwnerSupabase(booking: Record<string, unknown> | null) {
  const maybeSingle = vi.fn().mockResolvedValue({
    data: booking,
    error: null,
  });
  const eqSecond = vi.fn().mockReturnValue({ maybeSingle });
  const eqFirst = vi.fn().mockReturnValue({ eq: eqSecond });
  const select = vi.fn().mockReturnValue({ eq: eqFirst });
  const from = vi.fn().mockReturnValue({ select });
  return { from } as unknown as import('@supabase/supabase-js').SupabaseClient;
}

const completedBooking = {
  id: 'booking-1',
  business_id: 'biz-1',
  customer_id: 'cust-1',
  customer_email: 'jane@example.com',
  customer_name: 'Jane',
  service_name: 'Detail',
  scheduled_date: '2026-06-01',
  start_time: '09:30:00',
  status: 'completed',
};

describe('requestReviewInviteForBooking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createSupabaseAdminClientMock.mockReturnValue({});
  });

  it('returns 404 when booking is not found', async () => {
    const result = await requestReviewInviteForBooking(
      mockOwnerSupabase(null),
      'biz-1',
      'booking-1'
    );
    expect(result).toEqual({
      ok: false,
      status: 404,
      error: 'Booking not found',
    });
    expect(createReviewInviteIfEligibleMock).not.toHaveBeenCalled();
  });

  it('returns 400 when booking is not completed', async () => {
    const result = await requestReviewInviteForBooking(
      mockOwnerSupabase({ ...completedBooking, status: 'confirmed' }),
      'biz-1',
      'booking-1'
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.status).toBe(400);
    expect(createReviewInviteIfEligibleMock).not.toHaveBeenCalled();
  });

  it('returns skipped when not eligible', async () => {
    createReviewInviteIfEligibleMock.mockResolvedValue({
      ok: true,
      skipped: true,
      reason: 'customer_already_reviewed',
    });

    const result = await requestReviewInviteForBooking(
      mockOwnerSupabase(completedBooking),
      'biz-1',
      'booking-1'
    );

    expect(result).toEqual({
      ok: true,
      sent: false,
      skipped: true,
      reason: 'customer_already_reviewed',
    });
  });

  it('returns sent when invite email succeeds', async () => {
    createReviewInviteIfEligibleMock.mockResolvedValue({
      ok: true,
      sent: true,
      inviteId: 'inv-1',
    });

    const result = await requestReviewInviteForBooking(
      mockOwnerSupabase(completedBooking),
      'biz-1',
      'booking-1'
    );

    expect(result).toEqual({
      ok: true,
      sent: true,
      skipped: false,
      inviteId: 'inv-1',
    });
    expect(createReviewInviteIfEligibleMock).toHaveBeenCalledOnce();
  });
});
