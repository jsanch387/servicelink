import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ReviewsGoogleConnectCard } from '../components/cards/ReviewsGoogleConnectCard';
import {
  GOOGLE_CONNECT_CONNECTED_LEAD,
  GOOGLE_CONNECT_CONNECTED_TITLE,
  GOOGLE_CONNECT_CTA,
  GOOGLE_CONNECT_LEAD,
  GOOGLE_CONNECT_PULL_CTA,
  GOOGLE_CONNECT_TITLE,
} from '../copy/googleConnectCopy';

afterEach(() => cleanup());

describe('ReviewsGoogleConnectCard', () => {
  it('renders the connect CTA and explanation', () => {
    render(<ReviewsGoogleConnectCard onConnect={() => undefined} />);

    expect(
      screen.getByRole('heading', { name: GOOGLE_CONNECT_TITLE })
    ).toBeTruthy();
    expect(screen.getByText(GOOGLE_CONNECT_LEAD)).toBeTruthy();
    expect(
      screen.getByRole('button', { name: GOOGLE_CONNECT_CTA })
    ).toBeTruthy();
  });

  it('calls onConnect when the CTA is clicked', async () => {
    const user = userEvent.setup();
    const onConnect = vi.fn();
    render(<ReviewsGoogleConnectCard onConnect={onConnect} />);

    await user.click(screen.getByRole('button', { name: GOOGLE_CONNECT_CTA }));

    expect(onConnect).toHaveBeenCalledTimes(1);
  });

  it('shows only pull after Google is connected', () => {
    render(
      <ReviewsGoogleConnectCard
        connected
        onConnect={() => undefined}
        onPullReviews={() => undefined}
      />
    );

    expect(
      screen.getByRole('heading', { name: GOOGLE_CONNECT_CONNECTED_TITLE })
    ).toBeTruthy();
    expect(screen.getByText(GOOGLE_CONNECT_CONNECTED_LEAD)).toBeTruthy();
    expect(
      screen.queryByRole('button', { name: GOOGLE_CONNECT_CTA })
    ).toBeNull();
    expect(
      screen.getByRole('button', { name: GOOGLE_CONNECT_PULL_CTA })
    ).toBeTruthy();
  });

  it('calls onPullReviews when the pull CTA is clicked', async () => {
    const user = userEvent.setup();
    const onPullReviews = vi.fn();
    render(
      <ReviewsGoogleConnectCard
        connected
        onConnect={() => undefined}
        onPullReviews={onPullReviews}
      />
    );

    await user.click(
      screen.getByRole('button', { name: GOOGLE_CONNECT_PULL_CTA })
    );
    expect(onPullReviews).toHaveBeenCalledTimes(1);
  });
});
