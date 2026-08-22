import { describe, expect, it } from 'vitest';
import { mapGoogleStarRating } from '../server/googleReviewStarRating';
import { googleReviewsParentName } from '../server/googleReviewsParentName';
import { mapGoogleReviewApiRow } from '../server/mapGoogleReviewToPublic';

describe('google review mappers', () => {
  it('maps star rating enums', () => {
    expect(mapGoogleStarRating('FIVE')).toBe(5);
    expect(mapGoogleStarRating('one')).toBe(1);
    expect(mapGoogleStarRating('STAR')).toBeNull();
  });

  it('builds the v4 reviews parent path', () => {
    expect(googleReviewsParentName('accounts/123', 'locations/456')).toBe(
      'accounts/123/locations/456'
    );
    expect(
      googleReviewsParentName('accounts/123', 'accounts/123/locations/456')
    ).toBe('accounts/123/locations/456');
  });

  it('maps a Google review API row', () => {
    const mapped = mapGoogleReviewApiRow({
      reviewId: 'r1',
      starRating: 'FIVE',
      comment: 'Great work',
      createTime: '2026-08-22T12:00:00Z',
      reviewer: { displayName: 'Sam' },
    });

    expect(mapped?.publicReview).toEqual({
      id: 'google:r1',
      authorDisplayName: 'Sam',
      rating: 5,
      body: 'Great work',
      createdAt: '2026-08-22T12:00:00Z',
      source: 'google',
      ownerReply: undefined,
    });
  });
});
