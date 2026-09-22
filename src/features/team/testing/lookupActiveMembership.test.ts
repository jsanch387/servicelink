import { describe, expect, it, vi } from 'vitest';

import { lookupActiveMembership } from '../server/lookupActiveMembership';

function createMemberClient(result: {
  data: { business_id: string; role: string } | null;
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

describe('lookupActiveMembership', () => {
  it('returns the first active membership', async () => {
    const supabase = createMemberClient({
      data: { business_id: 'biz-2', role: 'member' },
      error: null,
    });

    await expect(
      lookupActiveMembership(supabase as never, 'user-2')
    ).resolves.toEqual({ businessId: 'biz-2', role: 'member' });

    expect(supabase.from).toHaveBeenCalledWith('business_members');
    expect(supabase.query.eq).toHaveBeenCalledWith('user_id', 'user-2');
    expect(supabase.query.eq).toHaveBeenCalledWith('status', 'active');
  });

  it('returns null when the query fails', async () => {
    const supabase = createMemberClient({
      data: null,
      error: { message: 'missing table' },
    });

    await expect(
      lookupActiveMembership(supabase as never, 'user-2')
    ).resolves.toBeNull();
  });
});
