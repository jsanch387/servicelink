import { GET } from '@/app/api/notifications/route';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createSupabaseServerClientMock } = vi.hoisted(() => ({
  createSupabaseServerClientMock: vi.fn(),
}));

vi.mock('@/libs/supabase/server', () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

function thenableQuery(result: unknown) {
  const self = {
    select: () => self,
    eq: () => self,
    order: () => self,
    range: () => self,
    then: (
      resolve: (value: unknown) => unknown,
      reject?: (reason: unknown) => unknown
    ) => Promise.resolve(result).then(resolve, reject),
  };
  return self;
}

describe('GET /api/notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    createSupabaseServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'nope' },
        }),
      },
    });

    const res = await GET(
      new NextRequest('http://localhost/api/notifications')
    );
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json).toEqual({
      success: false,
      error: 'Authentication required',
    });
  });

  it('returns a page of unread notifications by default', async () => {
    const rows = [
      { id: 'unread-1', read: false, title: 'New appointment' },
      { id: 'read-1', read: true, title: 'Earlier booking' },
      { id: 'extra', read: true, title: 'Overflow' },
    ];

    const from = vi
      .fn()
      .mockImplementationOnce(() => thenableQuery({ data: rows, error: null }))
      .mockImplementationOnce(() => thenableQuery({ count: 1, error: null }));

    createSupabaseServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1' } },
          error: null,
        }),
      },
      from,
    });

    const res = await GET(
      new NextRequest('http://localhost/api/notifications?limit=2&offset=0')
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(rows.slice(0, 2));
    expect(json.unreadCount).toBe(1);
    expect(json.hasMore).toBe(true);
    expect(from).toHaveBeenCalledWith('notifications');
  });
});
