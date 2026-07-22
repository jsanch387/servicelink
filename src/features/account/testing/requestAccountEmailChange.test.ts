import { describe, expect, it, vi } from 'vitest';
import { requestAccountEmailChange } from '../server/requestAccountEmailChange';

describe('requestAccountEmailChange', () => {
  it('rejects invalid email', async () => {
    const updateUser = vi.fn();
    const result = await requestAccountEmailChange({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { auth: { updateUser } } as any,
      currentEmail: 'old@example.com',
      newEmail: 'not-an-email',
      emailRedirectTo: 'https://example.com/callback',
    });

    expect(result).toEqual({
      ok: false,
      code: 'INVALID_EMAIL',
      error: 'Enter a valid email address.',
    });
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('rejects same email', async () => {
    const updateUser = vi.fn();
    const result = await requestAccountEmailChange({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { auth: { updateUser } } as any,
      currentEmail: 'Owner@Example.com',
      newEmail: 'owner@example.com',
      emailRedirectTo: 'https://example.com/callback',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('SAME_EMAIL');
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('calls updateUser and returns pending email', async () => {
    const updateUser = vi.fn().mockResolvedValue({ data: {}, error: null });
    const result = await requestAccountEmailChange({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { auth: { updateUser } } as any,
      currentEmail: 'old@example.com',
      newEmail: ' New@Business.com ',
      emailRedirectTo: 'https://example.com/callback?next=%2Fsettings',
    });

    expect(result).toEqual({
      ok: true,
      pendingEmail: 'new@business.com',
    });
    expect(updateUser).toHaveBeenCalledWith(
      { email: 'new@business.com' },
      { emailRedirectTo: 'https://example.com/callback?next=%2Fsettings' }
    );
  });

  it('maps already-registered errors to EMAIL_IN_USE', async () => {
    const updateUser = vi.fn().mockResolvedValue({
      data: {},
      error: {
        message: 'A user with this email address has already been registered',
      },
    });
    const result = await requestAccountEmailChange({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: { auth: { updateUser } } as any,
      currentEmail: 'old@example.com',
      newEmail: 'taken@example.com',
      emailRedirectTo: 'https://example.com/callback',
    });

    expect(result).toEqual({
      ok: false,
      code: 'EMAIL_IN_USE',
      error: 'That email is already in use by another account.',
    });
  });
});
