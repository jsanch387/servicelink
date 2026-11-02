import { describe, expect, it, vi } from 'vitest';

import { lookupActiveMemberBusinessId } from '../server/lookupActiveMemberBusinessId';

function createMemberClient(result: {
  data: { business_id: string } | null;
  error: unknown;
}) {
  const maybeSingle = vi.fn().mockResolvedValue(result);
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    maybeSingle,
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.limit.mockReturnValue(query);
  const from = vi.fn().mockReturnValue(query);
  return { from, query };
}

describe('lookupActiveMemberBusinessId', () => {
  it('returns the first active membership business id', async () => {
    const supabase = createMemberClient({
      data: { business_id: 'biz-2' },
      error: null,
    });

    await expect(
      lookupActiveMemberBusinessId(supabase as never, 'user-2')
    ).resolves.toBe('biz-2');

    expect(supabase.from).toHaveBeenCalledWith('business_members');
    expect(supabase.query.eq).toHaveBeenCalledWith('user_id', 'user-2');
    expect(supabase.query.eq).toHaveBeenCalledWith('status', 'active');
  });

  it('returns null when the table is missing or the query fails', async () => {
    const supabase = createMemberClient({
      data: null,
      error: { message: 'relation business_members does not exist' },
    });

    await expect(
      lookupActiveMemberBusinessId(supabase as never, 'user-2')
    ).resolves.toBeNull();
  });

  it('returns null when the user has no active membership', async () => {
    const supabase = createMemberClient({ data: null, error: null });

    await expect(
      lookupActiveMemberBusinessId(supabase as never, 'user-2')
    ).resolves.toBeNull();
  });
});
