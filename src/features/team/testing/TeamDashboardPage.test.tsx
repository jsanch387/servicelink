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

import { TeamDashboardPage } from '../components/TeamDashboardPage';
import type { TeamMemberUi } from '../types/teamMemberUi';

beforeAll(() => {
  window.scrollTo = () => undefined;
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('TeamDashboardPage', () => {
  beforeEach(() => {
    const members: TeamMemberUi[] = [
      {
        id: 'member-1',
        email: 'jordan@example.com',
        name: 'Jordan',
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
            name?: string;
          };
          const member: TeamMemberUi = {
            id: 'invite-1',
            email: (body.email ?? '').trim().toLowerCase(),
            name: body.name?.trim() || null,
            status: 'invited',
            source: 'invite',
          };
          members.push(member);
          return Response.json({ ok: true }, { status: 201 });
        }

        if (url.includes('/api/team/members') && method === 'PATCH') {
          const body = JSON.parse(String(init?.body ?? '{}')) as {
            id?: string;
            name?: string;
          };
          const nextName = body.name?.trim() || '';
          const index = members.findIndex(row => row.id === body.id);
          if (index >= 0) {
            members[index] = { ...members[index], name: nextName };
          }
          return Response.json({ success: true, name: nextName });
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
    render(<TeamDashboardPage />);

    expect(await screen.findByText('Jordan')).toBeTruthy();
    expect(screen.queryByText('No team members yet')).toBeNull();

    await user.click(
      screen.getByRole('button', { name: 'Invite team member' })
    );
    const inviteDialog = screen.getByRole('dialog');
    await user.type(
      within(inviteDialog).getByPlaceholderText('Full name'),
      'Alex Rivera'
    );
    await user.type(
      within(inviteDialog).getByPlaceholderText('name@email.com'),
      'alex@shop.com'
    );
    await user.click(
      within(inviteDialog).getByRole('button', { name: 'Send invite' })
    );

    expect(await screen.findByText('Alex Rivera')).toBeTruthy();
    expect(screen.getByText('alex@shop.com')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Open Jordan' }));
    const detail = screen.getByRole('dialog', { name: 'Team member' });
    expect(within(detail).getByText('jordan@example.com')).toBeTruthy();
    expect(within(detail).getByText('Active')).toBeTruthy();
    await user.click(
      within(detail).getByRole('button', { name: 'Remove from team' })
    );
    const removeDialog = screen.getByRole('dialog', { name: 'Remove' });
    await user.click(
      within(removeDialog).getByRole('button', { name: 'Remove' })
    );

    await waitFor(() => {
      expect(screen.queryByText('jordan@example.com')).toBeNull();
    });

    await user.click(screen.getByRole('button', { name: 'Open Alex Rivera' }));
    await user.click(screen.getByRole('button', { name: 'Remove from team' }));
    await user.click(screen.getByRole('button', { name: 'Remove' }));

    expect(await screen.findByText('No team members yet')).toBeTruthy();
  });

  it('does not treat a failed load as an empty team', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json(
          { success: false, error: 'Could not load team' },
          { status: 500 }
        )
      )
    );

    render(<TeamDashboardPage />);

    expect(await screen.findByText('Could not load team')).toBeTruthy();
    expect(screen.queryByText('No team members yet')).toBeNull();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
  });
});
