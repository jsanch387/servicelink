import { AvailabilityBookingDetailPanel } from '@/features/availability/booking/dashboard/AvailabilityBookingDetailPanel';
import type {
  AvailabilityBookingDisplay,
  BookingPaymentSummaryDisplay,
} from '@/features/availability/booking/dashboard/types';
import { DEFAULT_SCHEDULE } from '@/features/availability/types/availability';
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

function baseBooking(
  payment: BookingPaymentSummaryDisplay | null | undefined
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
    payment,
  };
}

function renderPanel(booking: AvailabilityBookingDisplay) {
  return render(
    <AvailabilityBookingDetailPanel
      booking={booking}
      onClose={vi.fn()}
      onMarkCompleted={vi.fn()}
      onCancel={vi.fn()}
      onDelete={vi.fn()}
      weeklySchedule={DEFAULT_SCHEDULE}
      timeOffBlocks={[]}
      existingBookingsForSlotGrid={[]}
    />
  );
}

function getPaymentCard() {
  const heading = screen.getByRole('heading', { name: /^payment$/i });
  const region = heading.parentElement;
  expect(region).toBeTruthy();
  return region as HTMLElement;
}

describe('AvailabilityBookingDetailPanel payment section', () => {
  it('shows Collect in person, Amount due, and formatted total when customer pays in person', () => {
    const payment: BookingPaymentSummaryDisplay = {
      paymentStatus: 'awaiting_payment',
      paymentMethodSelected: 'pay_in_person',
      currency: 'usd',
      totalAmountCents: 150_00,
      paidOnlineAmountCents: 0,
      remainingAmountCents: 150_00,
    };
    renderPanel(baseBooking(payment));

    const card = getPaymentCard();
    expect(within(card).getByText('Collect in person')).toBeTruthy();
    expect(within(card).getByText('Amount due')).toBeTruthy();
    expect(within(card).getByText('$150.00')).toBeTruthy();
  });

  it('shows No charge when total is zero (not Collect in person)', () => {
    const payment: BookingPaymentSummaryDisplay = {
      paymentStatus: 'not_required',
      paymentMethodSelected: 'pay_in_person',
      currency: 'usd',
      totalAmountCents: 0,
      paidOnlineAmountCents: 0,
      remainingAmountCents: 0,
    };
    renderPanel(baseBooking(payment));

    const card = getPaymentCard();
    expect(within(card).getByText('No charge')).toBeTruthy();
    expect(
      within(card).getByText(/nothing to collect for this appointment/i)
    ).toBeTruthy();
    expect(within(card).queryByText('Collect in person')).toBeNull();
  });

  it('shows Membership for plan-covered visits', () => {
    const payment: BookingPaymentSummaryDisplay = {
      paymentStatus: 'not_required',
      paymentMethodSelected: 'membership',
      currency: 'usd',
      totalAmountCents: 0,
      paidOnlineAmountCents: 0,
      remainingAmountCents: 0,
    };
    renderPanel(baseBooking(payment));

    const card = getPaymentCard();
    expect(within(card).getByText('Membership')).toBeTruthy();
    expect(within(card).getByText(/covered by their plan/i)).toBeTruthy();
    expect(within(card).queryByText('Collect in person')).toBeNull();
  });

  it('shows Deposit paid heading plus Amount paid and Amount due rows', () => {
    const payment: BookingPaymentSummaryDisplay = {
      paymentStatus: 'deposit_paid',
      paymentMethodSelected: 'pay_now',
      currency: 'usd',
      totalAmountCents: 150_00,
      paidOnlineAmountCents: 50_00,
      remainingAmountCents: 100_00,
    };
    renderPanel(baseBooking(payment));

    const card = getPaymentCard();
    expect(within(card).getByText('Deposit paid')).toBeTruthy();
    expect(within(card).getByText('Amount paid')).toBeTruthy();
    expect(within(card).getByText('Amount due')).toBeTruthy();
    expect(within(card).getByText('$50.00')).toBeTruthy();
    expect(within(card).getByText('$100.00')).toBeTruthy();
  });

  it('shows Paid with check and full amount when nothing remains', () => {
    const payment: BookingPaymentSummaryDisplay = {
      paymentStatus: 'paid_full',
      paymentMethodSelected: 'pay_now',
      currency: 'usd',
      totalAmountCents: 150_00,
      paidOnlineAmountCents: 150_00,
      remainingAmountCents: 0,
    };
    renderPanel(baseBooking(payment));

    const card = getPaymentCard();
    expect(within(card).getByText('Paid')).toBeTruthy();
    expect(within(card).getByText('$150.00')).toBeTruthy();
    expect(card.querySelectorAll('svg').length).toBeGreaterThan(0);
  });

  it('shows Collect in person with amount due for owner-created (none) bookings', () => {
    const payment: BookingPaymentSummaryDisplay = {
      paymentStatus: 'not_required',
      paymentMethodSelected: 'none',
      currency: 'usd',
      totalAmountCents: 80_00,
      paidOnlineAmountCents: 0,
      remainingAmountCents: 80_00,
    };
    renderPanel(baseBooking(payment));

    const card = getPaymentCard();
    expect(within(card).getByText('Collect in person')).toBeTruthy();
    expect(within(card).getByText('Amount due')).toBeTruthy();
    expect(within(card).getByText('$80.00')).toBeTruthy();
  });

  it('does not render a payment block when booking has no payment summary', () => {
    renderPanel(baseBooking(undefined));
    expect(screen.queryByRole('heading', { name: /^payment$/i })).toBeNull();
  });
});

describe('AvailabilityBookingDetailPanel customer section', () => {
  it('shows only the customer name when phone and email are empty', () => {
    const booking = baseBooking(undefined);
    booking.customerPhone = '';
    booking.customerEmail = '';
    renderPanel(booking);

    expect(screen.getByText('Jane Customer')).toBeTruthy();
    expect(screen.queryByRole('link', { name: /call customer/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /email customer/i })).toBeNull();
  });

  it('does not throw when customerEmail is null (optional email bookings)', () => {
    const booking = baseBooking(undefined);
    booking.customerEmail = null as unknown as string;
    expect(() => renderPanel(booking)).not.toThrow();
    expect(screen.getByText('Jane Customer')).toBeTruthy();
    expect(screen.queryByRole('link', { name: /email customer/i })).toBeNull();
  });

  it('formats US phones with +1 and does not treat country code as area code', () => {
    const booking = baseBooking(undefined);
    booking.customerPhone = '15807545207';
    renderPanel(booking);

    expect(screen.getByText('+1 (580) 754-5207')).toBeTruthy();
    expect(screen.queryByText(/\(158\)/)).toBeNull();
    const callLink = screen.getByRole('link', { name: /call customer/i });
    expect(callLink.getAttribute('href')).toBe('tel:+15807545207');
    expect(
      screen.getByRole('button', { name: /copy phone number/i })
    ).toBeTruthy();
  });

  it('marks membership visits on the customer card', () => {
    renderPanel(
      baseBooking({
        paymentStatus: 'not_required',
        paymentMethodSelected: 'membership',
        currency: 'usd',
        totalAmountCents: 0,
        paidOnlineAmountCents: 0,
        remainingAmountCents: 0,
      })
    );

    expect(screen.getAllByText('Membership').length).toBeGreaterThanOrEqual(1);
  });
});
