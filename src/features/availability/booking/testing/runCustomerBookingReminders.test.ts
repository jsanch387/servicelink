import { runCustomerBookingReminders } from '@/features/availability/booking/server/reminders';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock(
  '@/features/availability/booking/server/reminders/notifyCustomerForBookingReminder',
  () => ({
    notifyCustomerForBookingReminder: vi.fn(),
  })
);

import { notifyCustomerForBookingReminder } from '@/features/availability/booking/server/reminders/notifyCustomerForBookingReminder';

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

describe('runCustomerBookingReminders', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('notifies each booking that has contact info', async () => {
    vi.mocked(notifyCustomerForBookingReminder).mockResolvedValue({
      email: 'sent',
      sms: 'sent',
    });

    const from = vi.fn().mockImplementation((table: string) => {
      if (table === 'bookings') {
        return bookingsQuery([
          {
            id: 'b1',
            business_id: 'biz-1',
            scheduled_date: '2026-08-21',
            start_time: '09:00',
            service_name: 'Wash',
            customer_name: 'Alex',
            customer_email: 'a@example.com',
            customer_phone: '+15555550100',
            customer_id: 'c1',
          },
        ]);
      }
      if (table === 'business_profiles') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: [{ id: 'biz-1', business_name: 'Urban' }],
              error: null,
            }),
          }),
        };
      }
      return {};
    });

    const result = await runCustomerBookingReminders({ from } as never, {
      now: new Date('2026-08-20T14:00:00.000Z'),
    });

    expect(result).toMatchObject({
      targetDate: '2026-08-21',
      bookingsFound: 1,
      considered: 1,
      emailSent: 1,
      smsSent: 1,
      skipped: 0,
    });
    expect(notifyCustomerForBookingReminder).toHaveBeenCalledTimes(1);
  });

  it('notifies every booking with contact info', async () => {
    vi.mocked(notifyCustomerForBookingReminder).mockResolvedValue({
      email: 'sent',
      sms: 'sent',
    });

    const rows = [1, 2, 3].map(n => ({
      id: `b${n}`,
      business_id: 'biz-1',
      scheduled_date: '2026-08-21',
      start_time: '09:00',
      service_name: 'Wash',
      customer_name: `Alex ${n}`,
      customer_email: `a${n}@example.com`,
      customer_phone: `+1555555010${n}`,
      customer_id: `c${n}`,
    }));

    const from = vi.fn().mockImplementation((table: string) => {
      if (table === 'bookings') {
        return bookingsQuery(rows);
      }
      if (table === 'business_profiles') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: [{ id: 'biz-1', business_name: 'Urban' }],
              error: null,
            }),
          }),
        };
      }
      return {};
    });

    const result = await runCustomerBookingReminders({ from } as never, {
      now: new Date('2026-08-20T14:00:00.000Z'),
    });

    expect(result.considered).toBe(3);
    expect(result.emailSent).toBe(3);
    expect(result.smsSent).toBe(3);
    expect(notifyCustomerForBookingReminder).toHaveBeenCalledTimes(3);
  });

  it('dry-run does not notify', async () => {
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === 'bookings') {
        return bookingsQuery([
          {
            id: 'b1',
            business_id: 'biz-1',
            scheduled_date: '2026-08-21',
            start_time: '09:00',
            service_name: 'Wash',
            customer_name: 'Alex',
            customer_email: 'a@example.com',
            customer_phone: null,
            customer_id: 'c1',
          },
        ]);
      }
      if (table === 'business_profiles') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: [{ id: 'biz-1', business_name: 'Urban' }],
              error: null,
            }),
          }),
        };
      }
      return {};
    });

    const result = await runCustomerBookingReminders({ from } as never, {
      now: new Date('2026-08-20T14:00:00.000Z'),
      dryRun: true,
    });

    expect(result.considered).toBe(1);
    expect(result.emailSent).toBe(0);
    expect(notifyCustomerForBookingReminder).not.toHaveBeenCalled();
  });
});
