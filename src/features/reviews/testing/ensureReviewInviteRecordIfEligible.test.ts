import { describe, expect, it, vi } from 'vitest';
import { ensureReviewInviteRecordIfEligible } from '../server/ensureReviewInviteRecordIfEligible';
import type { SupabaseClient } from '@supabase/supabase-js';

function mockSupabase(handlers: {
  bookingInvite?: { id: string } | null;
  existingReview?: boolean;
  pendingInvite?: { id: string } | null;
  insertId?: string;
  refreshId?: string;
  refreshEmpty?: boolean;
}) {
  let reviewInviteReads = 0;

  return {
    from: vi.fn((table: string) => {
      const api = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        single: vi.fn(),
        maybeSingle: vi.fn(),
      };

      if (table === 'reviews') {
        api.maybeSingle.mockResolvedValue({
          data: handlers.existingReview ? { id: 'r1' } : null,
          error: null,
        });
        return api;
      }

      if (table === 'review_invites') {
        reviewInviteReads += 1;
        const readIndex = reviewInviteReads;

        api.maybeSingle.mockImplementation(() => {
          if (readIndex === 1) {
            return Promise.resolve({
              data: handlers.bookingInvite ?? null,
              error: null,
            });
          }
          if (handlers.pendingInvite) {
            if (readIndex === 2) {
              return Promise.resolve({
                data: handlers.pendingInvite,
                error: null,
              });
            }
            if (handlers.refreshEmpty) {
              return Promise.resolve({ data: null, error: null });
            }
            return Promise.resolve({
              data: { id: handlers.refreshId ?? handlers.pendingInvite.id },
              error: null,
            });
          }
          return Promise.resolve({ data: null, error: null });
        });

        api.single.mockResolvedValue({
          data: { id: handlers.insertId ?? 'inv-new' },
          error: null,
        });
      }

      return api;
    }),
  } as unknown as SupabaseClient;
}

const booking = {
  id: 'booking-2',
  business_id: 'biz-1',
  customer_id: 'cust-1',
};

describe('ensureReviewInviteRecordIfEligible', () => {
  it('skips when there is no customer_id', async () => {
    const result = await ensureReviewInviteRecordIfEligible(mockSupabase({}), {
      ...booking,
      customer_id: null,
    });
    expect(result).toEqual({
      ok: true,
      skipped: true,
      reason: 'no_customer_id',
    });
  });

  it('skips when this booking already has an invite', async () => {
    const result = await ensureReviewInviteRecordIfEligible(
      mockSupabase({ bookingInvite: { id: 'inv-0' } }),
      booking
    );
    expect(result).toEqual({
      ok: true,
      skipped: true,
      reason: 'invite_already_exists',
    });
  });

  it('skips when the customer already reviewed', async () => {
    const result = await ensureReviewInviteRecordIfEligible(
      mockSupabase({ existingReview: true }),
      booking
    );
    expect(result).toEqual({
      ok: true,
      skipped: true,
      reason: 'customer_already_reviewed',
    });
  });

  it('creates a new invite when none exists', async () => {
    const result = await ensureReviewInviteRecordIfEligible(
      mockSupabase({ insertId: 'inv-new' }),
      booking
    );
    expect(result.ok).toBe(true);
    if (!result.ok || result.skipped) {
      throw new Error('expected a created invite');
    }
    expect(result.inviteId).toBe('inv-new');
    expect(result.reusedExisting).toBe(false);
    expect(result.rawReviewToken.length).toBeGreaterThan(10);
  });

  it('reuses a pending invite from an earlier booking and rotates the token', async () => {
    const supabase = mockSupabase({
      pendingInvite: { id: 'inv-pending' },
      refreshId: 'inv-pending',
    });
    const result = await ensureReviewInviteRecordIfEligible(supabase, booking);

    expect(result.ok).toBe(true);
    if (!result.ok || result.skipped) {
      throw new Error('expected a reused invite');
    }
    expect(result.inviteId).toBe('inv-pending');
    expect(result.reusedExisting).toBe(true);
    expect(result.rawReviewToken.length).toBeGreaterThan(10);

    const reviewInviteFrom = vi
      .mocked(supabase.from)
      .mock.calls.filter(([table]) => table === 'review_invites');
    expect(reviewInviteFrom.length).toBe(3);

    const refreshApi = vi.mocked(supabase.from).mock.results[
      vi
        .mocked(supabase.from)
        .mock.calls.findLastIndex(([table]) => table === 'review_invites')
    ]?.value as { update: ReturnType<typeof vi.fn> };
    expect(refreshApi.update).toHaveBeenCalledWith(
      expect.objectContaining({
        link_token_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
      })
    );
  });
});
