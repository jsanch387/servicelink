import { describe, expect, it } from 'vitest';
import { mapReviewRowToPublicProfile } from '../server/mapReviewRowToPublicProfile';

const baseRow = {
  id: 'rev-1',
  author_display_name: 'Alex Rivera',
  rating: 5,
  body: 'Great work.',
  created_at: '2025-06-10T15:00:00.000Z',
  owner_reply_body: null,
  owner_replied_at: null,
};

describe('mapReviewRowToPublicProfile', () => {
  it('maps snake_case fields to public profile shape', () => {
    expect(mapReviewRowToPublicProfile(baseRow)).toEqual({
      id: 'rev-1',
      authorDisplayName: 'Alex Rivera',
      rating: 5,
      body: 'Great work.',
      createdAt: '2025-06-10T15:00:00.000Z',
      ownerReply: undefined,
    });
  });

  it('includes ownerReply when body and repliedAt are present', () => {
    expect(
      mapReviewRowToPublicProfile({
        ...baseRow,
        owner_reply_body: 'Thank you!',
        owner_replied_at: '2025-06-11T10:00:00.000Z',
      })
    ).toEqual({
      id: 'rev-1',
      authorDisplayName: 'Alex Rivera',
      rating: 5,
      body: 'Great work.',
      createdAt: '2025-06-10T15:00:00.000Z',
      ownerReply: {
        body: 'Thank you!',
        repliedAt: '2025-06-11T10:00:00.000Z',
      },
    });
  });

  it('omits ownerReply when reply fields are blank', () => {
    expect(
      mapReviewRowToPublicProfile({
        ...baseRow,
        owner_reply_body: '   ',
        owner_replied_at: '2025-06-11T10:00:00.000Z',
      }).ownerReply
    ).toBeUndefined();
  });
});
