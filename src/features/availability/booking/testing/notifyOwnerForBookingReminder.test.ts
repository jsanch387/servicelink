import { notifyOwnerForBookingReminder } from '@/features/availability/booking/server/reminders/notifyOwnerForBookingReminder';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/push/server/sendExpoPushToUser', () => ({
  sendExpoPushToUser: vi.fn().mockResolvedValue(undefined),
}));

import { sendExpoPushToUser } from '@/features/push/server/sendExpoPushToUser';

describe('notifyOwnerForBookingReminder', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('skips when the owner profile is missing', async () => {
    const from = vi.fn();
    const result = await notifyOwnerForBookingReminder({ from } as never, {
      profileId: null,
      targetDate: '2026-08-21',
    });

    expect(result).toBe('skipped');
    expect(from).not.toHaveBeenCalled();
    expect(sendExpoPushToUser).not.toHaveBeenCalled();
  });

  it('inserts inbox + push on the first send', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === 'notifications') return { insert };
      return { insert: vi.fn() };
    });

    const result = await notifyOwnerForBookingReminder({ from } as never, {
      profileId: 'owner-1',
      targetDate: '2026-08-21',
    });

    expect(result).toBe('sent');
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'owner-1',
        type: 'booking_reminder',
        reference_type: 'screen',
        reference_id: '00000000-0000-4000-a000-0000000000b1',
        title: 'Upcoming appointment',
        body: 'You have an appointment coming up.',
        dedupe_key: 'booking_reminder:owner-1:2026-08-21',
        metadata: { reference_type: 'screen', reference_id: 'bookings' },
      })
    );
    expect(sendExpoPushToUser).toHaveBeenCalledWith(
      expect.objectContaining({ from }),
      expect.objectContaining({
        userId: 'owner-1',
        title: 'Upcoming appointment',
        body: 'You have an appointment coming up.',
        data: { reference_type: 'screen', reference_id: 'bookings' },
      })
    );
  });

  it('does not push again when the inbox row already exists', async () => {
    const insert = vi.fn().mockResolvedValue({ error: { code: '23505' } });
    const from = vi.fn().mockReturnValue({ insert });

    const result = await notifyOwnerForBookingReminder({ from } as never, {
      profileId: 'owner-1',
      targetDate: '2026-08-21',
    });

    expect(result).toBe('duplicate');
    expect(sendExpoPushToUser).not.toHaveBeenCalled();
  });
});
