import { ReviewsSection } from '@/features/business-profile/reviews/components/ReviewsSection';
import { samplePublicReviewsData } from '@/features/business-profile/testing/publicReviewFixtures';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(() => cleanup());

describe('ReviewsSection', () => {
  it('renders summary and one card per review', () => {
    render(<ReviewsSection data={samplePublicReviewsData} />);

    const ui = publicBookingUi('en');
    expect(
      screen.getByRole('region', { name: ui.profile.reviewsSectionTitle })
    ).toBeTruthy();
    expect(screen.getByText('5.0')).toBeTruthy();
    expect(screen.getByText('Jordan Lee')).toBeTruthy();
    expect(screen.getByText('2 reviews')).toBeTruthy();
    expect(screen.getAllByRole('article')).toHaveLength(2);
  });

  it('uses localized section title for Spanish', () => {
    const ui = publicBookingUi('es');
    render(
      <ReviewsSection data={samplePublicReviewsData} bookingFlowLocale="es" />
    );

    expect(
      screen.getByRole('region', { name: ui.profile.reviewsSectionTitle })
    ).toBeTruthy();
  });
});
