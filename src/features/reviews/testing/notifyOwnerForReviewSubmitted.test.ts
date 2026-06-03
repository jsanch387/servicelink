import { notifyOwnerForReviewSubmitted } from '@/features/reviews/server/notifyOwnerForReviewSubmitted';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/push/server/sendExpoPushToUser', () => ({
  sendExpoPushToUser: vi.fn().mockResolvedValue(undefined),
}));

import { sendExpoPushToUser } from '@/features/push/server/sendExpoPushToUser';

describe('notifyOwnerForReviewSubmitted', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('skips when business has no profile_id', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const insert = vi.fn();
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === 'business_profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { profile_id: null },
                error: null,
              }),
            }),
          }),
        };
      }
      return { insert };
    });

    await notifyOwnerForReviewSubmitted({ from } as never, {
      businessId: 'biz-1',
      reviewId: 'review-1',
      customerName: 'Jordan',
    });

    expect(insert).not.toHaveBeenCalled();
    expect(sendExpoPushToUser).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('inserts notification and sends push when owner profile exists', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === 'business_profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { profile_id: 'owner-profile-uuid' },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'notifications') {
        return { insert };
      }
      return { insert: vi.fn() };
    });

    await notifyOwnerForReviewSubmitted({ from } as never, {
      businessId: 'biz-1',
      reviewId: 'review-uuid',
      customerName: 'Jordan',
    });

    expect(insert).toHaveBeenCalledWith({
      user_id: 'owner-profile-uuid',
      type: 'review_submitted',
      reference_type: 'review',
      reference_id: 'review-uuid',
      title: 'New review',
      body: 'From Jordan',
      dedupe_key: 'review:review-uuid',
      metadata: { customerName: 'Jordan' },
    });

    expect(sendExpoPushToUser).toHaveBeenCalledWith(
      expect.objectContaining({ from }),
      {
        userId: 'owner-profile-uuid',
        title: 'New review',
        body: 'From Jordan',
        data: { reference_type: 'review', reference_id: 'review-uuid' },
      }
    );
  });
});
