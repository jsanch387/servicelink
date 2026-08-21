import { runOwnerBookingReminders } from '@/features/availability/booking/server/runOwnerBookingReminders';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/push/server/sendExpoPushToUser', () => ({
  sendExpoPushToUser: vi.fn().mockResolvedValue(undefined),
}));

import { sendExpoPushToUser } from '@/features/push/server/sendExpoPushToUser';

function bookingsQuery(rows: unknown[]) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({ data: rows, error: null }),
          }),
        }),
      }),
    }),
  };
}

describe('runOwnerBookingReminders', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('sends one reminder when an owner has several jobs tomorrow', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === 'bookings') {
        return bookingsQuery([
          { business_id: 'biz-1' },
          { business_id: 'biz-1' },
        ]);
      }
      if (table === 'business_profiles') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: [{ id: 'biz-1', profile_id: 'owner-1' }],
              error: null,
            }),
          }),
        };
      }
      if (table === 'notifications') {
        return { insert };
      }
      return {};
    });

    const result = await runOwnerBookingReminders({ from } as never, {
      now: new Date('2026-08-20T14:00:00.000Z'),
    });

    expect(result).toMatchObject({
      targetDate: '2026-08-21',
      bookingsFound: 2,
      considered: 1,
      sent: 1,
      duplicate: 0,
      skipped: 0,
      failed: 0,
    });
    expect(sendExpoPushToUser).toHaveBeenCalledTimes(1);
  });

  it('dry-run counts owners and does not insert or push', async () => {
    const insert = vi.fn();
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === 'bookings') {
        return bookingsQuery([{ business_id: 'biz-1' }]);
      }
      if (table === 'business_profiles') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: [{ id: 'biz-1', profile_id: 'owner-1' }],
              error: null,
            }),
          }),
        };
      }
      return { insert };
    });

    const result = await runOwnerBookingReminders({ from } as never, {
      now: new Date('2026-08-20T14:00:00.000Z'),
      dryRun: true,
    });

    expect(result).toMatchObject({
      bookingsFound: 1,
      considered: 1,
      sent: 0,
    });
    expect(insert).not.toHaveBeenCalled();
    expect(sendExpoPushToUser).not.toHaveBeenCalled();
  });

  it('skips businesses whose owner profile is missing', async () => {
    const insert = vi.fn();
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === 'bookings') {
        return bookingsQuery([{ business_id: 'biz-1' }]);
      }
      if (table === 'business_profiles') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      }
      return { insert };
    });

    const result = await runOwnerBookingReminders({ from } as never, {
      now: new Date('2026-08-20T14:00:00.000Z'),
    });

    expect(result.skipped).toBe(1);
    expect(result.sent).toBe(0);
    expect(insert).not.toHaveBeenCalled();
    expect(sendExpoPushToUser).not.toHaveBeenCalled();
  });
});
