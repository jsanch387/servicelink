import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  findAuthUserIdByEmail,
  updateAccountEmailAdmin,
} from '../server/updateAccountEmailAdmin';

const getUserById = vi.fn();
const updateUserById = vi.fn();
const listUsers = vi.fn();

vi.mock('@/libs/supabase/admin', () => ({
  createSupabaseAdminClient: () => ({
    auth: {
      admin: {
        getUserById,
        updateUserById,
        listUsers,
      },
    },
  }),
}));

describe('updateAccountEmailAdmin', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('updates email with email_confirm', async () => {
    getUserById.mockResolvedValue({
      data: { user: { id: 'u1', email: 'old@example.com' } },
      error: null,
    });
    updateUserById.mockResolvedValue({
      data: { user: { id: 'u1', email: 'new@example.com' } },
      error: null,
    });

    const result = await updateAccountEmailAdmin({
      userId: 'u1',
      newEmail: 'new@example.com',
    });

    expect(result).toEqual({
      ok: true,
      userId: 'u1',
      previousEmail: 'old@example.com',
      email: 'new@example.com',
    });
    expect(updateUserById).toHaveBeenCalledWith('u1', {
      email: 'new@example.com',
      email_confirm: true,
    });
  });

  it('rejects when new email equals current', async () => {
    getUserById.mockResolvedValue({
      data: { user: { id: 'u1', email: 'same@example.com' } },
      error: null,
    });

    const result = await updateAccountEmailAdmin({
      userId: 'u1',
      newEmail: 'Same@Example.com',
    });

    expect(result.ok).toBe(false);
    expect(updateUserById).not.toHaveBeenCalled();
  });
});

describe('findAuthUserIdByEmail', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('finds user case-insensitively', async () => {
    listUsers.mockResolvedValue({
      data: {
        users: [{ id: 'u9', email: 'Typo@Gmail.com' }],
      },
      error: null,
    });

    const id = await findAuthUserIdByEmail('typo@gmail.com');
    expect(id).toBe('u9');
  });
});
