import { ReviewsSetupEmptyState } from '@/features/reviews/dashboard/components/list/ReviewsSetupEmptyState';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(() => cleanup());

describe('ReviewsSetupEmptyState', () => {
  it('opens the how reviews work steps', () => {
    render(<ReviewsSetupEmptyState />);

    expect(screen.getByRole('heading', { name: 'No reviews' })).toBeTruthy();
    expect(screen.getByText('Reviews you get will show up here.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'How reviews work' }));

    expect(screen.getByRole('heading', { name: 'After a visit' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(
      screen.getByRole('heading', { name: 'One review each' })
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('heading', { name: 'Your reply' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(
      screen.getByRole('heading', { name: 'Google reviews' })
    ).toBeTruthy();
  });
});
