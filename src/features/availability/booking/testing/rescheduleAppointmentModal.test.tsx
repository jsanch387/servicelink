import { RescheduleAppointmentModal } from '@/features/availability/booking/dashboard/RescheduleAppointmentModal';
import type { AvailabilityBookingDisplay } from '@/features/availability/booking/dashboard/types';
import { DEFAULT_SCHEDULE } from '@/features/availability/types/availability';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

/** A future weekday so the date step stays put. Past dates jump straight to time. */
function upcomingWeekdayKey(): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + 7);
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function booking(
  overrides: Partial<AvailabilityBookingDisplay> = {}
): AvailabilityBookingDisplay {
  return {
    id: 'booking-1',
    customerName: 'Jane Customer',
    customerPhone: '5551234567',
    customerEmail: 'jane@example.com',
    serviceName: 'Full detail',
    serviceDurationMinutes: 60,
    servicePriceCents: 150_00,
    addonDetails: [],
    jobs: [],
    date: '2026-09-18',
    time: '2:00 PM',
    startTimeHHmm: '14:00',
    status: 'confirmed',
    address: {
      street: '100 Main St',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
    },
    notes: '',
    createdAt: '2026-01-10T12:00:00Z',
    ...overrides,
  };
}

describe('RescheduleAppointmentModal overlap heads-up', () => {
  it('keeps a taken time pickable and shows a heads-up', async () => {
    const user = userEvent.setup();
    const date = upcomingWeekdayKey();

    render(
      <RescheduleAppointmentModal
        isOpen
        booking={booking({ date })}
        weeklySchedule={DEFAULT_SCHEDULE}
        timeOffBlocks={[]}
        existingBookingsForSlotGrid={[
          {
            date,
            startTime: '09:00',
            durationMinutes: 60,
          },
        ]}
        onClose={vi.fn()}
        onSave={vi.fn().mockResolvedValue({ success: true })}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(
      screen.getByText(
        'You already have 1 appointment on this day. Continue to move this one here.'
      )
    ).toBeTruthy();

    await user.click(screen.getByRole('button', { name: '9 AM' }));

    expect(
      screen.getByText(
        'You already have an appointment at this time. You can still save.'
      )
    ).toBeTruthy();
  });
});
