import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createReviewInviteIfEligible } from '../server/createReviewInviteIfEligible';

vi.mock('@/features/email/review-invite/sendReviewInviteEmail', () => ({
  sendReviewInviteEmail: vi.fn().mockResolvedValue({ sent: true }),
}));

const { sendAndRecordSmsMock } = vi.hoisted(() => ({
  sendAndRecordSmsMock: vi.fn(),
}));

// Mock the SMS transport but keep the real message builder + toE164.
vi.mock('@/features/sms', async importOriginal => {
  const actual = await importOriginal<typeof import('@/features/sms')>();
  return { ...actual, sendAndRecordSms: sendAndRecordSmsMock };
});

const { sendReviewInviteEmail } = await import(
  '@/features/email/review-invite/sendReviewInviteEmail'
);

function baseBooking() {
  return {
    id: 'booking-1',
    business_id: 'biz-1',
    customer_id: 'cust-1',
    customer_email: 'jane@example.com',
    customer_phone: null as string | null,
    customer_name: 'Jane Doe',
    service_name: 'Full detail',
    scheduled_date: '2026-06-01',
    start_time: '09:30:00',
  };
}

function mockSupabase(handlers: {
  businessName?: string;
  existingInvite?: { id: string } | null;
  existingReview?: boolean;
  pendingInvite?: boolean;
  insertId?: string;
}) {
  const chain = (table: string) => {
    const api = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
      single: vi.fn(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
    };

    if (table === 'business_profiles') {
      api.maybeSingle.mockResolvedValue({
        data: { business_name: handlers.businessName ?? 'Acme' },
        error: null,
      });
    }

    if (table === 'reviews') {
      api.maybeSingle.mockResolvedValue({
        data: handlers.existingReview ? { id: 'r1' } : null,
        error: null,
      });
    }

    if (table === 'review_invites') {
      const firstMaybe = handlers.existingInvite
        ? {
            data: { id: 'inv-0', status: 'pending', email_sent_at: null },
            error: null,
          }
        : { data: null, error: null };

      let maybeCall = 0;
      api.maybeSingle.mockImplementation(() => {
        maybeCall += 1;
        if (maybeCall === 1) return Promise.resolve(firstMaybe);
        if (handlers.pendingInvite) {
          return Promise.resolve({ data: { id: 'inv-p' }, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });

      api.single.mockResolvedValue({
        data: { id: handlers.insertId ?? 'inv-new' },
        error: null,
      });

      api.update.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
    }

    return api;
  };

  return {
    from: vi.fn((table: string) => chain(table)),
  } as unknown as import('@supabase/supabase-js').SupabaseClient;
}

describe('createReviewInviteIfEligible', () => {
  beforeEach(() => {
    vi.mocked(sendReviewInviteEmail).mockClear();
    vi.mocked(sendReviewInviteEmail).mockResolvedValue({ sent: true });
    sendAndRecordSmsMock.mockReset();
    sendAndRecordSmsMock.mockResolvedValue({ sent: true, messageId: 'sms-1' });
  });

  it('skips when there is no phone and no email (no contact method)', async () => {
    const result = await createReviewInviteIfEligible(mockSupabase({}), {
      ...baseBooking(),
      customer_email: '',
      customer_phone: null,
    });
    expect(result).toEqual({
      ok: true,
      skipped: true,
      reason: 'no_contact_method',
    });
    expect(sendReviewInviteEmail).not.toHaveBeenCalled();
    expect(sendAndRecordSmsMock).not.toHaveBeenCalled();
  });

  it('skips when no customer_id', async () => {
    const result = await createReviewInviteIfEligible(mockSupabase({}), {
      ...baseBooking(),
      customer_id: null,
    });
    expect(result).toEqual({
      ok: true,
      skipped: true,
      reason: 'no_customer_id',
    });
  });

  it('skips when customer already reviewed', async () => {
    const result = await createReviewInviteIfEligible(
      mockSupabase({ existingReview: true }),
      baseBooking()
    );
    expect(result).toEqual({
      ok: true,
      skipped: true,
      reason: 'customer_already_reviewed',
    });
  });

  it('texts the review link first when the customer has a phone', async () => {
    const result = await createReviewInviteIfEligible(
      mockSupabase({ insertId: 'inv-99' }),
      { ...baseBooking(), customer_phone: '5807545207' }
    );
    expect(result).toEqual({
      ok: true,
      skipped: false,
      sent: true,
      channel: 'sms',
      inviteId: 'inv-99',
      smsResult: { sent: true, messageId: 'sms-1' },
    });
    expect(sendAndRecordSmsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'review_invite',
        to: '5807545207',
        dedupeKey: 'booking-1:review_invite',
        message: expect.stringContaining('/review/'),
      })
    );
    // SMS succeeded → no email (no double notification).
    expect(sendReviewInviteEmail).not.toHaveBeenCalled();
  });

  it('falls back to email when the SMS fails', async () => {
    sendAndRecordSmsMock.mockResolvedValue({
      sent: false,
      reason: 'invalid_number',
    });
    const result = await createReviewInviteIfEligible(
      mockSupabase({ insertId: 'inv-99' }),
      { ...baseBooking(), customer_phone: '123' }
    );
    expect(result).toEqual({
      ok: true,
      skipped: false,
      sent: true,
      channel: 'email',
      inviteId: 'inv-99',
    });
    expect(sendAndRecordSmsMock).toHaveBeenCalledTimes(1);
    expect(sendReviewInviteEmail).toHaveBeenCalledWith(
      'jane@example.com',
      expect.objectContaining({
        customerName: 'Jane Doe',
        publicReviewUrl: expect.stringContaining('/review/'),
      })
    );
  });

  it('emails directly when there is no phone', async () => {
    const result = await createReviewInviteIfEligible(
      mockSupabase({ insertId: 'inv-99' }),
      baseBooking()
    );
    expect(result).toEqual({
      ok: true,
      skipped: false,
      sent: true,
      channel: 'email',
      inviteId: 'inv-99',
    });
    expect(sendAndRecordSmsMock).not.toHaveBeenCalled();
    expect(sendReviewInviteEmail).toHaveBeenCalledWith(
      'jane@example.com',
      expect.objectContaining({ customerName: 'Jane Doe' })
    );
  });
});
