import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ReviewsGoogleConnectCard } from '../components/cards/ReviewsGoogleConnectCard';
import {
  GOOGLE_CONNECT_CONNECTED_LEAD,
  GOOGLE_CONNECT_CONNECTED_STATUS,
  GOOGLE_CONNECT_CONNECTED_TITLE,
  GOOGLE_CONNECT_CTA,
  GOOGLE_CONNECT_LEAD,
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

  it('shows a connected status instead of another action', () => {
    render(<ReviewsGoogleConnectCard connected onConnect={() => undefined} />);

    expect(
      screen.getByRole('heading', { name: GOOGLE_CONNECT_CONNECTED_TITLE })
    ).toBeTruthy();
    expect(screen.getByText(GOOGLE_CONNECT_CONNECTED_LEAD)).toBeTruthy();
    expect(
      screen.getByRole('status', { name: GOOGLE_CONNECT_CONNECTED_STATUS })
    ).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
