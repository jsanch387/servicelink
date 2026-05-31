import { ReviewExpandableText } from '@/features/business-profile/reviews/components/display/ReviewExpandableText';
import { REVIEW_BODY_COLLAPSED_MAX_MOBILE } from '@/features/business-profile/reviews/utils/reviewTextDisplay';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
}

afterEach(() => cleanup());

describe('ReviewExpandableText', () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  it('returns null for empty text', () => {
    const { container } = render(
      <ReviewExpandableText text="   " variant="reviewBody" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('does not show toggle for short text', () => {
    render(<ReviewExpandableText text="Short review." variant="reviewBody" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('truncates long text and expands on See more', async () => {
    const user = userEvent.setup();
    const longText = 'word '.repeat(REVIEW_BODY_COLLAPSED_MAX_MOBILE);

    render(
      <ReviewExpandableText
        text={longText}
        variant="reviewBody"
        seeMoreLabel="See more"
        seeLessLabel="Show less"
      />
    );

    expect(screen.getByText(/…$/)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'See more' }));
    const showLess = screen.getByRole('button', { name: 'Show less' });
    expect(showLess).toBeTruthy();
    expect(showLess.getAttribute('aria-expanded')).toBe('true');
  });
});
