import { describe, expect, it, vi } from 'vitest';

import { lookupOwnedBusinessId } from '../server/lookupOwnedBusinessId';

function createOwnedClient(result: {
  data: { id: string } | null;
  error: unknown;
}) {
  const maybeSingle = vi.fn().mockResolvedValue(result);
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });
  return { from, select, eq, maybeSingle };
}

describe('lookupOwnedBusinessId', () => {
  it('returns the owned business id', async () => {
    const supabase = createOwnedClient({
      data: { id: 'biz-1' },
      error: null,
    });

    await expect(
      lookupOwnedBusinessId(supabase as never, 'user-1')
    ).resolves.toBe('biz-1');

    expect(supabase.from).toHaveBeenCalledWith('business_profiles');
    expect(supabase.eq).toHaveBeenCalledWith('profile_id', 'user-1');
  });

  it('returns null when there is no owned business', async () => {
    const supabase = createOwnedClient({ data: null, error: null });

    await expect(
      lookupOwnedBusinessId(supabase as never, 'user-1')
    ).resolves.toBeNull();
  });

  it('returns null on query error', async () => {
    const supabase = createOwnedClient({
      data: null,
      error: { message: 'db fail' },
    });

    await expect(
      lookupOwnedBusinessId(supabase as never, 'user-1')
    ).resolves.toBeNull();
  });
});
