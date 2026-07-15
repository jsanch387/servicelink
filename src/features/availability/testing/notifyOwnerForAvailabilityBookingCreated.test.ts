import { notifyOwnerForAvailabilityBookingCreated } from '@/features/availability/services/notifyOwnerForAvailabilityBookingCreated';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/push/server/sendExpoPushToUser', () => ({
  sendExpoPushToUser: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/features/email', () => ({
  sendAvailabilityBookingNotificationEmail: vi

    .fn()
    .mockResolvedValue(undefined),
}));

import { sendAvailabilityBookingNotificationEmail } from '@/features/email';
import { sendExpoPushToUser } from '@/features/push/server/sendExpoPushToUser';

describe('notifyOwnerForAvailabilityBookingCreated', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('skips work when profileId is null', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const from = vi.fn();
    const supabase = { from } as never;

    await notifyOwnerForAvailabilityBookingCreated(supabase, {
      profileId: null,
      bookingId: 'b1',
      customerName: 'Alex',
      serviceSummaryLine: 'Wash',
      scheduledDate: '2026-05-10',
      emailPayload: {
        customerName: 'Alex',
        customerEmail: 'a@example.com',
        serviceName: 'Wash',
        scheduledDate: '2026-05-10',
        startTime: '10:00',
        durationMinutes: 60,
        selectedAddOns: [],
        totalPriceCents: 0,
        paymentSummary: { title: 'Payment', rows: [] },
      },
    });

    expect(from).not.toHaveBeenCalled();
    expect(sendExpoPushToUser).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('inserts notification, push, and email when owner has email', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === 'notifications') {
        return { insert };
      }
      return { insert: vi.fn() };
    });

    const getUserById = vi.fn().mockResolvedValue({
      data: { user: { email: 'owner@example.com' } },
    });

    const supabase = {
      from,
      auth: { admin: { getUserById } },
    } as never;

    await notifyOwnerForAvailabilityBookingCreated(supabase, {
      correlationId: 'req-trace',
      profileId: 'profile-uuid',
      bookingId: 'booking-uuid',
      customerName: 'Jordan',
      serviceSummaryLine: 'Full detail',
      scheduledDate: '2026-05-10',
      emailPayload: {
        customerName: 'Jordan',
        customerEmail: 'j@example.com',
        serviceName: 'Full detail',
        scheduledDate: '2026-05-10',
        startTime: '14:00',
        durationMinutes: 120,
        servicePriceCents: 10000,
        selectedAddOns: [],
        totalPriceCents: 10000,
        paymentSummary: { title: 'Payment', rows: [] },
      },
    });

    expect(from).toHaveBeenCalledWith('notifications');
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'profile-uuid',
        type: 'availability_booking',
        reference_type: 'booking',
        reference_id: 'booking-uuid',
        title: 'New appointment',
        body: 'From Jordan',
      })
    );

    expect(sendExpoPushToUser).toHaveBeenCalledWith(
      supabase,
      expect.objectContaining({
        userId: 'profile-uuid',
        title: 'New appointment',
        body: 'From Jordan',
        data: { reference_type: 'booking', reference_id: 'booking-uuid' },
      })
    );

    expect(sendAvailabilityBookingNotificationEmail).toHaveBeenCalledWith(
      'owner@example.com',
      expect.objectContaining({ customerName: 'Jordan' })
    );
  });

  it('uses owner-created notification copy when flagged on email payload', async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === 'notifications') {
        return { insert };
      }
      return { insert: vi.fn() };
    });

    const getUserById = vi.fn().mockResolvedValue({
      data: { user: { email: 'owner@example.com' } },
    });

    const supabase = {
      from,
      auth: { admin: { getUserById } },
    } as never;

    await notifyOwnerForAvailabilityBookingCreated(supabase, {
      profileId: 'profile-uuid',
      bookingId: 'booking-uuid',
      customerName: 'Sam',
      serviceSummaryLine: 'Custom detail',
      scheduledDate: '2026-05-10',
      emailPayload: {
        customerName: 'Sam',
        customerEmail: '',
        serviceName: 'Custom detail',
        scheduledDate: '2026-05-10',
        startTime: '14:00',
        durationMinutes: 120,
        servicePriceCents: 15000,
        selectedAddOns: [],
        totalPriceCents: 15000,
        paymentSummary: { title: 'Payment', rows: [] },
        createdByOwner: true,
      },
    });

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Appointment created',
        body: 'For Sam',
      })
    );
  });
});
