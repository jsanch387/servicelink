import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TeamMemberDetailPanel } from '../components/TeamMemberDetailPanel';
import type { TeamMemberUi } from '../types/teamMemberUi';

afterEach(() => {
  cleanup();
});

const member: TeamMemberUi = {
  id: 'member-1',
  email: 'jordan@example.com',
  name: 'Jordan',
  status: 'active',
  source: 'member',
};

describe('TeamMemberDetailPanel', () => {
  it('shows name, small email, status, and can save or remove', async () => {
    const user = userEvent.setup();
    const onSaveName = vi
      .fn()
      .mockResolvedValue({ ok: true, name: 'Jordan Lee' });
    const onRemove = vi.fn();

    render(
      <TeamMemberDetailPanel
        member={member}
        onClose={vi.fn()}
        onSaveName={onSaveName}
        onRemove={onRemove}
      />
    );

    expect(screen.getByRole('heading', { name: 'Team member' })).toBeTruthy();
    expect(screen.getByText('jordan@example.com')).toBeTruthy();
    expect(screen.getByText('Active')).toBeTruthy();

    expect(screen.queryByText('Display name')).toBeNull();

    const nameField = screen.getByLabelText('Name');
    await user.clear(nameField);
    await user.type(nameField, 'Jordan Lee');
    await user.click(screen.getByRole('button', { name: 'Save name' }));

    expect(onSaveName).toHaveBeenCalledWith(member, 'Jordan Lee');

    await user.click(screen.getByRole('button', { name: 'Remove from team' }));
    expect(onRemove).toHaveBeenCalledWith(member);
  });
});
