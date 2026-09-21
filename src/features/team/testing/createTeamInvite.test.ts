import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendTeamInviteEmail = vi.hoisted(() => vi.fn());

vi.mock('@/features/email/team-invite/sendTeamInviteEmail', () => ({
  sendTeamInviteEmail,
}));

vi.mock('@/features/email/services/resendClient', () => ({
  getAppBaseUrl: () => 'https://myservicelink.app',
}));

import { createTeamInvite } from '../server/createTeamInvite';

function createAdmin(options: { priorInviteId?: string | null }) {
  const update = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  });
  const insert = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: { id: 'new-invite' },
        error: null,
      }),
    }),
  });

  return {
    update,
    insert,
    from: vi.fn((table: string) => {
      if (table === 'business_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: options.priorInviteId
                      ? { id: options.priorInviteId, name: null }
                      : null,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
        update,
        insert,
      };
    }),
  };
}

describe('createTeamInvite', () => {
  beforeEach(() => {
    sendTeamInviteEmail.mockReset();
    sendTeamInviteEmail.mockResolvedValue({ sent: true, messageId: 're_1' });
  });

  it('reopens an accepted invite and emails them again', async () => {
    const admin = createAdmin({ priorInviteId: 'old-invite' });

    await expect(
      createTeamInvite(admin as never, {
        businessId: 'biz',
        invitedBy: 'owner',
        ownerEmail: 'owner@shop.com',
        businessName: 'Sparkle',
        rawEmail: 'jose@shop.com',
        name: 'Jose',
      })
    ).resolves.toEqual({
      ok: true,
      resent: true,
      invite: {
        id: 'old-invite',
        email: 'jose@shop.com',
        name: 'Jose',
        status: 'pending',
      },
      member: {
        id: 'old-invite',
        email: 'jose@shop.com',
        status: 'invited',
        source: 'invite',
      },
    });

    expect(admin.insert).not.toHaveBeenCalled();
    expect(admin.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'pending',
        accepted_user_id: null,
        name: 'Jose',
      })
    );
    expect(sendTeamInviteEmail).toHaveBeenCalledWith(
      'jose@shop.com',
      expect.objectContaining({
        businessName: 'Sparkle',
      })
    );
  });
});
