import { AvailabilityBookingDetailPanel } from '@/features/availability/booking/dashboard/AvailabilityBookingDetailPanel';
import type { AvailabilityBookingDisplay } from '@/features/availability/booking/dashboard/types';
import { DEFAULT_SCHEDULE } from '@/features/availability/types/availability';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

function baseBooking(
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
    date: '2026-06-15',
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

describe('AvailabilityBookingDetailPanel complete confirmation', () => {
  it('shows review invite copy when the customer has not reviewed yet', async () => {
    const user = userEvent.setup();
    const onMarkCompleted = vi.fn();

    render(
      <AvailabilityBookingDetailPanel
        booking={baseBooking({
          customerAlreadyReviewed: false,
          willSendReviewInviteOnComplete: true,
        })}
        onClose={vi.fn()}
        onMarkCompleted={onMarkCompleted}
        onCancel={vi.fn()}
        weeklySchedule={DEFAULT_SCHEDULE}
        timeOffBlocks={[]}
        existingBookingsForSlotGrid={[]}
      />
    );

    await user.click(
      screen.getByRole('button', { name: /mark booking as completed/i })
    );

    expect(
      screen.getByRole('heading', { name: /complete appointment/i })
    ).toBeTruthy();
    expect(screen.getByText(/this wraps up the appointment/i)).toBeTruthy();
    expect(screen.getByText(/leave a review/i)).toBeTruthy();
    expect(onMarkCompleted).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /mark as complete/i }));

    expect(onMarkCompleted).toHaveBeenCalledWith('booking-1');
  });

  it('shows a simple confirm when the customer already reviewed', async () => {
    const user = userEvent.setup();

    render(
      <AvailabilityBookingDetailPanel
        booking={baseBooking({
          customerAlreadyReviewed: true,
          willSendReviewInviteOnComplete: false,
        })}
        onClose={vi.fn()}
        onMarkCompleted={vi.fn()}
        onCancel={vi.fn()}
        weeklySchedule={DEFAULT_SCHEDULE}
        timeOffBlocks={[]}
        existingBookingsForSlotGrid={[]}
      />
    );

    await user.click(
      screen.getByRole('button', { name: /mark booking as completed/i })
    );

    expect(
      screen.getByText(
        /are you sure you want to mark this appointment complete/i
      )
    ).toBeTruthy();
    expect(screen.queryByText(/leave a review/i)).toBeNull();
  });

  it('still shows review invite copy when eligible except for pending invite', async () => {
    const user = userEvent.setup();

    render(
      <AvailabilityBookingDetailPanel
        booking={baseBooking({
          customerAlreadyReviewed: false,
          willSendReviewInviteOnComplete: false,
        })}
        onClose={vi.fn()}
        onMarkCompleted={vi.fn()}
        onCancel={vi.fn()}
        weeklySchedule={DEFAULT_SCHEDULE}
        timeOffBlocks={[]}
        existingBookingsForSlotGrid={[]}
      />
    );

    await user.click(
      screen.getByRole('button', { name: /mark booking as completed/i })
    );

    expect(screen.getByText(/leave a review/i)).toBeTruthy();
  });
});
