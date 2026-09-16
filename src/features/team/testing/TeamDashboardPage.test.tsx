import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { SettingsTeamSection } from '@/features/settings/components/SettingsTeamSection';
import type { TeamMemberUi } from '../types/teamMemberUi';

beforeAll(() => {
  window.scrollTo = () => undefined;
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('SettingsTeamSection', () => {
  beforeEach(() => {
    const members: TeamMemberUi[] = [
      {
        id: 'member-1',
        email: 'jordan@example.com',
        status: 'active',
        source: 'member',
      },
    ];

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? 'GET';

        if (url.includes('/api/team/members') && method === 'GET') {
          return Response.json({ success: true, members: [...members] });
        }

        if (url.includes('/api/team/invites') && method === 'POST') {
          const body = JSON.parse(String(init?.body ?? '{}')) as {
            email?: string;
          };
          const member: TeamMemberUi = {
            id: 'invite-1',
            email: (body.email ?? '').trim().toLowerCase(),
            status: 'invited',
            source: 'invite',
          };
          members.push(member);
          return Response.json({ success: true, member });
        }

        if (url.includes('/api/team/remove') && method === 'POST') {
          const body = JSON.parse(String(init?.body ?? '{}')) as {
            id?: string;
          };
          const index = members.findIndex(row => row.id === body.id);
          if (index >= 0) members.splice(index, 1);
          return Response.json({ success: true });
        }

        return Response.json({ success: false }, { status: 404 });
      })
    );
  });

  it('lists members and can invite and remove', async () => {
    const user = userEvent.setup();
    render(<SettingsTeamSection />);

    expect(await screen.findByText('jordan@example.com')).toBeTruthy();
    expect(screen.queryByText('No team members yet')).toBeNull();

    await user.click(
      screen.getByRole('button', { name: 'Invite team member' })
    );
    const inviteDialog = screen.getByRole('dialog');
    await user.type(
      within(inviteDialog).getByPlaceholderText('name@email.com'),
      'alex@shop.com'
    );
    await user.click(
      within(inviteDialog).getByRole('button', { name: 'Send invite' })
    );

    expect(await screen.findByText('alex@shop.com')).toBeTruthy();
    expect(screen.getByText('Invited')).toBeTruthy();

    await user.click(
      screen.getByRole('button', { name: 'Remove jordan@example.com' })
    );
    const removeDialog = screen.getByRole('dialog');
    await user.click(
      within(removeDialog).getByRole('button', { name: 'Remove' })
    );

    await waitFor(() => {
      expect(screen.queryByText('jordan@example.com')).toBeNull();
    });

    await user.click(
      screen.getByRole('button', { name: 'Remove alex@shop.com' })
    );
    await user.click(screen.getByRole('button', { name: 'Remove' }));

    expect(await screen.findByText('No team members yet')).toBeTruthy();
  });
});
