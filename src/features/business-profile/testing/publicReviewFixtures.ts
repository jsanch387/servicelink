import type { PublicProfileReviewsData } from '@/features/reviews';

export const samplePublicReview = {
  id: 'rev-1',
  authorDisplayName: 'Alex Rivera',
  rating: 5,
  body: 'Great service and fast turnaround.',
  createdAt: '2025-06-10T15:00:00.000Z',
} as const;

export const samplePublicReviewWithReply = {
  ...samplePublicReview,
  id: 'rev-2',
  authorDisplayName: 'Jordan Lee',
  ownerReply: {
    body: 'Thanks for the kind words!',
    repliedAt: '2025-06-11T10:00:00.000Z',
  },
} as const;

export const samplePublicReviewsData: PublicProfileReviewsData = {
  reviews: [samplePublicReview, samplePublicReviewWithReply],
  summary: {
    averageRating: 5,
    reviewCount: 2,
    breakdown: [
      { stars: 5, percent: 100 },
      { stars: 4, percent: 0 },
      { stars: 3, percent: 0 },
      { stars: 2, percent: 0 },
      { stars: 1, percent: 0 },
    ],
  },
};
