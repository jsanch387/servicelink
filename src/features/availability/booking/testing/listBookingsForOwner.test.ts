import { beforeEach, describe, expect, it, vi } from 'vitest';

import { listBookingsForOwner } from '../server/listBookingsForOwner';

const hydrate = vi.hoisted(() =>
  vi.fn(
    async (_supabase: unknown, _businessId: string, rows: { id: string }[]) =>
      rows.map(row => ({ id: row.id }))
  )
);

vi.mock('../server/hydrateBookingRowsForDisplay', () => ({
  hydrateBookingRowsForDisplay: hydrate,
}));

function row(id: string, date: string, time: string) {
  return { id, scheduled_date: date, start_time: time };
}

function createClient(rows: ReturnType<typeof row>[]) {
  const captured: {
    gte?: [string, string];
    lte?: [string, string];
    eqs: [string, string][];
    or?: string;
    limit?: number;
    orders: [string, { ascending: boolean }][];
  } = { orders: [], eqs: [] };

  const query = {
    select: vi.fn(() => query),
    eq: vi.fn((column: string, value: string) => {
      captured.eqs.push([column, value]);
      return query;
    }),
    gte: vi.fn((column: string, value: string) => {
      captured.gte = [column, value];
      return query;
    }),
    lte: vi.fn((column: string, value: string) => {
      captured.lte = [column, value];
      return query;
    }),
    order: vi.fn((column: string, opts: { ascending: boolean }) => {
      captured.orders.push([column, opts]);
      return query;
    }),
    or: vi.fn((expr: string) => {
      captured.or = expr;
      return query;
    }),
    limit: vi.fn((count: number) => {
      captured.limit = count;
      return Promise.resolve({ data: rows, error: null });
    }),
  };

  return {
    captured,
    supabase: {
      from: vi.fn(() => query),
    },
  };
}

describe('listBookingsForOwner', () => {
  beforeEach(() => {
    hydrate.mockClear();
  });

  it('pages upcoming soonest first and returns a cursor when another row exists', async () => {
    const rows = Array.from({ length: 16 }, (_, index) =>
      row(
        `11111111-1111-1111-1111-1111111111${String(index).padStart(2, '0')}`,
        '2026-09-14',
        '14:00:00'
      )
    );
    const { supabase, captured } = createClient(rows);

    const page = await listBookingsForOwner(supabase as never, 'biz', {
      kind: 'page',
      limit: 15,
      filter: 'upcoming',
      asOf: '2026-09-15',
      assignedToMe: false,
    });

    expect(captured.limit).toBe(16);
    expect(captured.eqs).toContainEqual(['status', 'confirmed']);
    expect(captured.gte).toEqual(['scheduled_date', '2026-09-15']);
    expect(captured.orders[0]).toEqual(['scheduled_date', { ascending: true }]);
    expect(page.bookings).toHaveLength(15);
    expect(page.hasMore).toBe(true);
    expect(page.nextCursor).toBe(
      '2026-09-14|14:00:00|11111111-1111-1111-1111-111111111114'
    );
    expect(hydrate).toHaveBeenCalledWith(supabase, 'biz', rows.slice(0, 15));
  });

  it('pages past newest first with the completed-or-elapsed filter', async () => {
    const { supabase, captured } = createClient([
      row('11111111-1111-1111-1111-111111111111', '2026-09-01', '09:00:00'),
    ]);

    await listBookingsForOwner(supabase as never, 'biz', {
      kind: 'page',
      limit: 15,
      filter: 'past',
      asOf: '2026-09-15',
      assignedToMe: false,
    });

    expect(captured.or).toBe(
      'status.eq.completed,and(status.eq.confirmed,scheduled_date.lt.2026-09-15)'
    );
    expect(captured.orders[0]).toEqual([
      'scheduled_date',
      { ascending: false },
    ]);
  });

  it('loads only the requested calendar window', async () => {
    const { supabase, captured } = createClient([
      row('11111111-1111-1111-1111-111111111111', '2026-09-02', '09:00:00'),
    ]);

    const page = await listBookingsForOwner(supabase as never, 'biz', {
      kind: 'range',
      from: '2026-08-30',
      to: '2026-10-10',
      assignedToMe: false,
    });

    expect(captured.gte).toEqual(['scheduled_date', '2026-08-30']);
    expect(captured.lte).toEqual(['scheduled_date', '2026-10-10']);
    expect(captured.or).toBeUndefined();
    expect(page.hasMore).toBe(false);
    expect(page.nextCursor).toBeNull();
  });

  it('narrows the list to the signed-in assignee', async () => {
    const { supabase, captured } = createClient([
      row('11111111-1111-1111-1111-111111111111', '2026-09-16', '09:00:00'),
    ]);

    await listBookingsForOwner(
      supabase as never,
      'biz',
      {
        kind: 'page',
        limit: 15,
        filter: 'upcoming',
        asOf: '2026-09-15',
        assignedToMe: true,
      },
      { assignedUserId: 'worker-1' }
    );

    expect(captured.eqs).toContainEqual(['assigned_user_id', 'worker-1']);
  });

  it('narrows a calendar range to the signed-in assignee', async () => {
    const { supabase, captured } = createClient([
      row('11111111-1111-1111-1111-111111111111', '2026-09-02', '09:00:00'),
    ]);

    await listBookingsForOwner(
      supabase as never,
      'biz',
      {
        kind: 'range',
        from: '2026-08-30',
        to: '2026-10-10',
        assignedToMe: true,
      },
      { assignedUserId: 'worker-1' }
    );

    expect(captured.eqs).toContainEqual(['assigned_user_id', 'worker-1']);
  });
});
