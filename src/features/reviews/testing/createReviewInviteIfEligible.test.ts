import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createReviewInviteIfEligible } from '../server/createReviewInviteIfEligible';

vi.mock('@/features/email/review-invite/sendReviewInviteEmail', () => ({
  sendReviewInviteEmail: vi.fn().mockResolvedValue({ sent: true }),
}));

const { sendReviewInviteEmail } = await import(
  '@/features/email/review-invite/sendReviewInviteEmail'
);

function baseBooking() {
  return {
    id: 'booking-1',
    business_id: 'biz-1',
    customer_id: 'cust-1',
    customer_email: 'jane@example.com',
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
  });

  it('skips when no customer email', async () => {
    const result = await createReviewInviteIfEligible(mockSupabase({}), {
      ...baseBooking(),
      customer_email: '',
    });
    expect(result).toEqual({
      ok: true,
      skipped: true,
      reason: 'no_customer_email',
    });
    expect(sendReviewInviteEmail).not.toHaveBeenCalled();
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

  it('creates invite and sends email when eligible', async () => {
    const result = await createReviewInviteIfEligible(
      mockSupabase({ insertId: 'inv-99' }),
      baseBooking()
    );
    expect(result).toEqual({ ok: true, sent: true, inviteId: 'inv-99' });
    expect(sendReviewInviteEmail).toHaveBeenCalledWith(
      'jane@example.com',
      expect.objectContaining({
        customerName: 'Jane Doe',
        publicReviewUrl: expect.stringContaining('/review/'),
      })
    );
  });
});
