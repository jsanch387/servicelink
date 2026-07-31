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
    jobs: [],
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
    payment: {
      paymentStatus: 'awaiting_payment',
      paymentMethodSelected: 'none',
      currency: 'usd',
      totalAmountCents: 150_00,
      paidOnlineAmountCents: 0,
      remainingAmountCents: 150_00,
    },
    ...overrides,
  };
}

describe('AvailabilityBookingDetailPanel complete confirmation', () => {
  it('opens complete modal with total and payment method tabs', async () => {
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
        onDelete={vi.fn()}
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
    expect(screen.getByText('Total due')).toBeTruthy();
    expect(screen.getAllByText('$150.00').length).toBeGreaterThan(0);
    expect(onMarkCompleted).not.toHaveBeenCalled();

    await user.click(screen.getByRole('tab', { name: /^payment app$/i }));
    await user.click(screen.getByRole('button', { name: /mark as complete/i }));

    expect(onMarkCompleted).toHaveBeenCalledWith('booking-1', {
      sessionPayment: { method: 'payment_app', amountCents: 150_00 },
    });
  });

  it('shows already-paid state when balance is zero', async () => {
    const user = userEvent.setup();

    render(
      <AvailabilityBookingDetailPanel
        booking={baseBooking({
          customerAlreadyReviewed: true,
          payment: {
            paymentStatus: 'paid_full',
            paymentMethodSelected: 'pay_now',
            currency: 'usd',
            totalAmountCents: 150_00,
            paidOnlineAmountCents: 150_00,
            remainingAmountCents: 0,
          },
        })}
        onClose={vi.fn()}
        onMarkCompleted={vi.fn()}
        onCancel={vi.fn()}
        onDelete={vi.fn()}
        weeklySchedule={DEFAULT_SCHEDULE}
        timeOffBlocks={[]}
        existingBookingsForSlotGrid={[]}
      />
    );

    await user.click(
      screen.getByRole('button', { name: /mark booking as completed/i })
    );

    expect(screen.getByText(/already paid/i)).toBeTruthy();
    expect(screen.queryByRole('tab', { name: /^cash$/i })).toBeNull();
    expect(
      screen.getByRole('button', { name: /mark as complete/i })
    ).toBeTruthy();
  });
});
