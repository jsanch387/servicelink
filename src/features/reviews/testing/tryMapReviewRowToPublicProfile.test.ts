import { describe, expect, it } from 'vitest';
import {
  mapReviewRowToPublicProfile,
  tryMapReviewRowToPublicProfile,
} from '../server/mapReviewRowToPublicProfile';

const validRow = {
  id: 'rev-1',
  author_display_name: 'Alex Rivera',
  rating: 5,
  body: 'Great work.',
  created_at: '2025-06-10T15:00:00.000Z',
  owner_reply_body: null,
  owner_replied_at: null,
};

describe('tryMapReviewRowToPublicProfile', () => {
  it('maps valid rows the same as mapReviewRowToPublicProfile', () => {
    expect(tryMapReviewRowToPublicProfile(validRow)).toEqual(
      mapReviewRowToPublicProfile(validRow)
    );
  });

  it('returns null for missing id, name, date, or invalid rating', () => {
    expect(tryMapReviewRowToPublicProfile({ ...validRow, id: '' })).toBeNull();
    expect(
      tryMapReviewRowToPublicProfile({ ...validRow, author_display_name: '  ' })
    ).toBeNull();
    expect(
      tryMapReviewRowToPublicProfile({ ...validRow, created_at: '' })
    ).toBeNull();
    expect(
      tryMapReviewRowToPublicProfile({ ...validRow, rating: 0 })
    ).toBeNull();
    expect(
      tryMapReviewRowToPublicProfile({ ...validRow, rating: 6 })
    ).toBeNull();
    expect(tryMapReviewRowToPublicProfile(null)).toBeNull();
  });
});
