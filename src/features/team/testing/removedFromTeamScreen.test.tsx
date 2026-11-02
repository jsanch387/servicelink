import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const signOutAndRedirect = vi.fn();

vi.mock('@/features/auth', () => ({
  useSignOutAndRedirect: () => ({
    signOutAndRedirect,
    loading: false,
  }),
}));

import { RemovedFromTeamScreen } from '../components/RemovedFromTeamScreen';

afterEach(() => {
  cleanup();
});

describe('RemovedFromTeamScreen', () => {
  it('names the shop and offers log out', () => {
    render(<RemovedFromTeamScreen businessName="Sparkle Mobile" />);

    expect(
      screen.getByRole('heading', { name: /no longer on this team/i })
    ).toBeTruthy();
    expect(screen.getByText(/Sparkle Mobile removed your access/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Log out' })).toBeTruthy();
    expect(
      screen
        .getByRole('link', { name: 'Create your own business' })
        .getAttribute('href')
    ).toBe('/dashboard?createShop=1');
  });
});
