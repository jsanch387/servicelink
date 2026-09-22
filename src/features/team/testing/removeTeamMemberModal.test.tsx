import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RemoveTeamMemberModal } from '../components/RemoveTeamMemberModal';

afterEach(() => {
  cleanup();
});

describe('RemoveTeamMemberModal', () => {
  it('shows a spinner on Remove while the request is in flight', async () => {
    const user = userEvent.setup();
    let finish!: () => void;
    const pending = new Promise<void>(resolve => {
      finish = resolve;
    });
    const onConfirm = vi.fn(() => pending);

    render(
      <RemoveTeamMemberModal
        member={{
          id: 'member-1',
          email: 'jordan@example.com',
          name: 'Jordan',
          status: 'active',
          source: 'member',
        }}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />
    );

    expect(
      screen.getByText(/won.?t be able to access this shop/i)
    ).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Remove' }));

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(
      screen.getByRole('button', { name: 'Removing team member' })
    ).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveProperty(
      'disabled',
      true
    );

    finish();
  });
});
