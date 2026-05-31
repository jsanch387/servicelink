import { ReviewsRatingSummary } from '@/features/business-profile/reviews/components/summary/ReviewsRatingSummary';
import { samplePublicReviewsData } from '@/features/business-profile/testing/publicReviewFixtures';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(() => cleanup());

describe('ReviewsRatingSummary', () => {
  it('shows formatted average and localized review count', () => {
    render(<ReviewsRatingSummary summary={samplePublicReviewsData.summary} />);

    expect(screen.getByText('5.0')).toBeTruthy();
    expect(screen.getByText('2 reviews')).toBeTruthy();
    expect(screen.getByText('100%')).toBeTruthy();
  });

  it('uses Spanish labels when locale is es', () => {
    const ui = publicBookingUi('es');
    render(
      <ReviewsRatingSummary
        summary={samplePublicReviewsData.summary}
        bookingFlowLocale="es"
      />
    );

    expect(screen.getByText(ui.profile.reviewCountLabel(2))).toBeTruthy();
  });
});
