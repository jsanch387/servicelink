import { PublicReviewForm } from '@/features/reviews/public/components/PublicReviewForm';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('PublicReviewForm submit button', () => {
  it('keeps Send my feedback visible with a spinner while submitting', async () => {
    const user = userEvent.setup();
    let resolveFetch: (value: Response) => void = () => {};
    const fetchPromise = new Promise<Response>(resolve => {
      resolveFetch = resolve;
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(() => fetchPromise)
    );

    render(
      <PublicReviewForm
        token="token-1"
        businessName="Black Label Auto"
        serviceName="Full detail"
      />
    );

    const stars = screen.getAllByRole('radio');
    await user.click(stars[4]!);

    const submitButton = screen.getByRole('button', {
      name: /send my feedback/i,
    });
    await user.click(submitButton);

    expect(screen.getByText('Send my feedback')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: /sending your feedback/i })
    ).toBeTruthy();

    resolveFetch(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledOnce();
    });
  });
});
