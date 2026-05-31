import type {
  PublicProfileReviewsData,
  PublicProfileReviewsSummary,
} from './publicProfile';

/** Result of loading visible reviews for a public business profile. */
export type LoadPublicBusinessReviewsResult =
  | { status: 'ok'; data: PublicProfileReviewsData }
  | { status: 'empty' }
  | { status: 'error'; message: string };

/** Ratings-only load for header + tab visibility (no review bodies). */
export type LoadPublicReviewSummaryResult =
  | { status: 'ok'; summary: PublicProfileReviewsSummary }
  | { status: 'empty' }
  | { status: 'error'; message: string };
