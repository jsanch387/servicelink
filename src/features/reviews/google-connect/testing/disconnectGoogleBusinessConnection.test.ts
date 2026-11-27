import { beforeEach, describe, expect, it, vi } from 'vitest';

const maybeSingle = vi.fn();
const reviewsDeleteEq = vi.fn();
const connectionDeleteEq = vi.fn();
const profilesUpdateEq = vi.fn();

vi.mock('@/libs/supabase/admin', () => ({
  createSupabaseAdminClient: () => ({
    from: (table: string) => {
      if (table === 'google_business_connections') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle,
            }),
          }),
          delete: () => ({
            eq: connectionDeleteEq,
          }),
        };
      }
      if (table === 'google_reviews') {
        return {
          delete: () => ({
            eq: reviewsDeleteEq,
          }),
        };
      }
      if (table === 'business_profiles') {
        return {
          update: () => ({
            eq: profilesUpdateEq,
          }),
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  }),
}));

describe('disconnectGoogleBusinessConnection', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true } as Response)
    );
  });

  it('is a no-op success when no connection exists', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    const { disconnectGoogleBusinessConnection } = await import(
      '../server/disconnectGoogleBusinessConnection'
    );

    await expect(
      disconnectGoogleBusinessConnection('biz-1')
    ).resolves.toEqual({ ok: true });
    expect(reviewsDeleteEq).not.toHaveBeenCalled();
    expect(connectionDeleteEq).not.toHaveBeenCalled();
    expect(profilesUpdateEq).not.toHaveBeenCalled();
  });

  it('revokes the token, clears reviews, deletes connection, resets destination', async () => {
    maybeSingle.mockResolvedValue({
      data: {
        id: 'conn-1',
        refresh_token: 'refresh-token',
        access_token: 'access-token',
      },
      error: null,
    });
    reviewsDeleteEq.mockResolvedValue({ error: null });
    connectionDeleteEq.mockResolvedValue({ error: null });
    profilesUpdateEq.mockResolvedValue({ error: null });

    const { disconnectGoogleBusinessConnection } = await import(
      '../server/disconnectGoogleBusinessConnection'
    );

    await expect(
      disconnectGoogleBusinessConnection('biz-1')
    ).resolves.toEqual({ ok: true });

    expect(fetch).toHaveBeenCalledWith(
      'https://oauth2.googleapis.com/revoke',
      expect.objectContaining({ method: 'POST' })
    );
    expect(reviewsDeleteEq).toHaveBeenCalledWith('business_id', 'biz-1');
    expect(connectionDeleteEq).toHaveBeenCalledWith('id', 'conn-1');
    expect(profilesUpdateEq).toHaveBeenCalledWith('id', 'biz-1');
  });
});
