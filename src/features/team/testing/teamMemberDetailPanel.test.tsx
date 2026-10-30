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
  it('shows the person, status, and can save a name or remove', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue({ ok: true, name: 'Jordan Lee' });
    const onRemove = vi.fn();

    render(
      <TeamMemberDetailPanel
        member={member}
        onClose={vi.fn()}
        onSave={onSave}
        onRemove={onRemove}
      />
    );

    expect(screen.getByRole('heading', { name: 'Team member' })).toBeTruthy();
    expect(screen.getByText('Jordan')).toBeTruthy();
    expect(screen.getByText('jordan@example.com')).toBeTruthy();
    expect(screen.getByText('Active')).toBeTruthy();
    expect(screen.getByText(/Sees every appointment/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Save' })).toHaveProperty(
      'disabled',
      true
    );

    const nameField = screen.getByRole('textbox', { name: /^Name/ });
    await user.clear(nameField);
    await user.type(nameField, 'Jordan Lee');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledWith(member, { name: 'Jordan Lee' });

    await user.click(screen.getByRole('button', { name: 'Remove from team' }));
    expect(onRemove).toHaveBeenCalledWith(member);
  });

  it('saves a new role from the same panel', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue({ ok: true, role: 'coordinator' });

    render(
      <TeamMemberDetailPanel
        member={member}
        onClose={vi.fn()}
        onSave={onSave}
        onRemove={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Role' }));
    await user.click(screen.getByRole('option', { name: /^Coordinator/ }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledWith(member, { role: 'coordinator' });
  });
});
