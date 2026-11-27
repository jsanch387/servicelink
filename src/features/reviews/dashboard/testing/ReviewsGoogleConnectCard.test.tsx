import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ReviewsGoogleConnectCard } from '../components/cards/ReviewsGoogleConnectCard';
import {
  GOOGLE_CONNECT_CONNECTED_STATUS,
  GOOGLE_CONNECT_CTA,
  GOOGLE_CONNECT_DISCONNECT,
  GOOGLE_CONNECT_LEAD,
  GOOGLE_CONNECT_REVIEW_LINK_COPY,
  GOOGLE_CONNECT_REVIEW_LINK_OPEN,
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

  it('shows a loading skeleton while status loads', () => {
    const { container } = render(
      <ReviewsGoogleConnectCard loading onConnect={() => undefined} />
    );

    expect(container.querySelector('[aria-hidden]')).toBeTruthy();
    expect(
      screen.queryByRole('button', { name: GOOGLE_CONNECT_CTA })
    ).toBeNull();
    expect(
      screen.queryByRole('status', { name: GOOGLE_CONNECT_CONNECTED_STATUS })
    ).toBeNull();
  });

  it('shows connected status and opens disconnect from the action', async () => {
    const user = userEvent.setup();
    const onDisconnect = vi.fn();
    render(
      <ReviewsGoogleConnectCard
        connected
        onConnect={() => undefined}
        onDisconnect={onDisconnect}
      />
    );

    expect(
      screen.getByRole('status', { name: GOOGLE_CONNECT_CONNECTED_STATUS })
    ).toBeTruthy();
    expect(
      screen.queryByRole('button', { name: GOOGLE_CONNECT_CTA })
    ).toBeNull();

    await user.click(
      screen.getByRole('button', { name: GOOGLE_CONNECT_DISCONNECT })
    );
    expect(onDisconnect).toHaveBeenCalledTimes(1);
  });

  it('shows a truncated review link with icon actions when connected', () => {
    const url =
      'https://search.google.com/local/writereview?placeid=ChIJ_test_very_long';
    render(
      <ReviewsGoogleConnectCard
        connected
        googleReviewUrl={url}
        onConnect={() => undefined}
        onDisconnect={() => undefined}
      />
    );

    expect(screen.getByText(url)).toBeTruthy();
    expect(
      screen.getByRole('button', { name: GOOGLE_CONNECT_REVIEW_LINK_COPY })
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: GOOGLE_CONNECT_REVIEW_LINK_OPEN })
    ).toBeTruthy();
  });
});
