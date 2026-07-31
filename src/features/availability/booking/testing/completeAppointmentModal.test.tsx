import { CompleteAppointmentModal } from '@/features/availability/booking/dashboard/CompleteAppointmentModal';
import type { AvailabilityBookingDisplay } from '@/features/availability/booking/dashboard/types';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

function baseBooking(
  override: Partial<AvailabilityBookingDisplay> = {}
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
    ...override,
  };
}

describe('CompleteAppointmentModal', () => {
  it('requires a payment method before complete when amount is due', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <CompleteAppointmentModal
        isOpen
        booking={baseBooking()}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />
    );

    expect(screen.getByText('Total due')).toBeTruthy();
    expect(screen.getByText('$150.00')).toBeTruthy();
    expect(screen.getByRole('tab', { name: /^cash$/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /^payment app$/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /^other$/i })).toBeTruthy();

    const completeBtn = screen.getByRole('button', {
      name: /mark as complete/i,
    });
    expect(completeBtn).toHaveProperty('disabled', true);

    await user.click(screen.getByRole('tab', { name: /^cash$/i }));
    expect(completeBtn).toHaveProperty('disabled', false);

    await user.click(completeBtn);
    expect(onConfirm).toHaveBeenCalledWith({
      sessionPayment: { method: 'cash', amountCents: 150_00 },
    });
  });

  it('skips method tabs when already paid and completes without sessionPayment', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <CompleteAppointmentModal
        isOpen
        booking={baseBooking({
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
        onConfirm={onConfirm}
      />
    );

    expect(screen.getByText('Already paid')).toBeTruthy();
    expect(screen.queryByRole('tab', { name: /^cash$/i })).toBeNull();

    await user.click(screen.getByRole('button', { name: /mark as complete/i }));
    expect(onConfirm).toHaveBeenCalledWith({});
  });
});
