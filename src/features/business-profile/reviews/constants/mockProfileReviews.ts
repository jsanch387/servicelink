/**
 * Mock review data for public profile (replace with API/DB later).
 */

export type MockProfileReview = {
  id: string;
  authorDisplayName: string;
  rating: number;
  body: string;
  createdAt: string;
  ownerReply?: {
    body: string;
    repliedAt: string;
  };
};

export const MOCK_PROFILE_REVIEW_SUMMARY = {
  averageRating: 4.9,
  reviewCount: 24,
} as const;

export const MOCK_PROFILE_RATING_BREAKDOWN: ReadonlyArray<{
  stars: number;
  percent: number;
}> = [
  { stars: 5, percent: 88 },
  { stars: 4, percent: 8 },
  { stars: 3, percent: 2 },
  { stars: 2, percent: 1 },
  { stars: 1, percent: 1 },
];

export const MOCK_PROFILE_REVIEWS: MockProfileReview[] = [
  {
    id: '1',
    authorDisplayName: 'Sarah M.',
    rating: 5,
    body: 'Excellent service! My car looks brand new. They were on time, professional, and walked me through everything before they started.',
    createdAt: '2025-12-15T18:00:00.000Z',
    ownerReply: {
      body: 'Thank you, Sarah — really appreciate you trusting us with your vehicle!',
      repliedAt: '2025-12-16T14:30:00.000Z',
    },
  },
  {
    id: '2',
    authorDisplayName: 'Mike R.',
    rating: 5,
    body: 'Professional and thorough. Will definitely book again. Fair pricing and great communication.',
    createdAt: '2025-12-10T16:20:00.000Z',
  },
  {
    id: '3',
    authorDisplayName: 'Jennifer L.',
    rating: 5,
    body: 'Best detail I have had in years. Attention to detail on the wheels and interior was impressive.',
    createdAt: '2025-11-28T20:10:00.000Z',
  },
  {
    id: '4',
    authorDisplayName: 'David K.',
    rating: 4,
    body: 'Great work overall. Took a little longer than expected but the results were worth the wait.',
    createdAt: '2025-11-12T12:00:00.000Z',
  },
  {
    id: '5',
    authorDisplayName: 'Amanda T.',
    rating: 5,
    body: 'Super easy to book online and the team was friendly from start to finish. Highly recommend.',
    createdAt: '2025-10-30T19:45:00.000Z',
  },
];
