import { ProfileReviewCard } from '@/features/business-profile/reviews/components/list/ProfileReviewCard';
import {
  samplePublicReview,
  samplePublicReviewWithReply,
} from '@/features/business-profile/testing/publicReviewFixtures';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(() => cleanup());

describe('ProfileReviewCard', () => {
  it('renders author, date, rating, and review body', () => {
    render(<ProfileReviewCard review={samplePublicReview} />);

    expect(screen.getByText('Alex Rivera')).toBeTruthy();
    expect(screen.getByText('Great service and fast turnaround.')).toBeTruthy();
    expect(screen.getByRole('time').getAttribute('datetime')).toBe(
      samplePublicReview.createdAt
    );
  });

  it('renders owner reply when present', () => {
    render(<ProfileReviewCard review={samplePublicReviewWithReply} />);

    expect(screen.getByText('Thanks for the kind words!')).toBeTruthy();
  });

  it('uses Spanish expand labels when locale is es', () => {
    const longBody = `${'Excelente servicio. '.repeat(20)}`.trim();
    render(
      <ProfileReviewCard
        review={{ ...samplePublicReview, body: longBody }}
        bookingFlowLocale="es"
      />
    );

    expect(screen.getByRole('button', { name: /ver más/i })).toBeTruthy();
  });
});
