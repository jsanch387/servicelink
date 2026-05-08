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
  it('shows Pay in person, Amount due, and formatted total when customer pays in person', () => {
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
    expect(within(card).getByText('Pay in person')).toBeTruthy();
    expect(within(card).getByText('Amount due')).toBeTruthy();
    expect(within(card).getByText('$150.00')).toBeTruthy();
  });

  it('shows no-amount note for pay in person when total is zero', () => {
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
    expect(within(card).getByText('Pay in person')).toBeTruthy();
    expect(
      within(card).getByText(/no amount due for this appointment/i)
    ).toBeTruthy();
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

  it('shows fallback copy when no online payment and not pay in person', () => {
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
    expect(
      within(card).getByText(
        /no card payment through the app for this booking/i
      )
    ).toBeTruthy();
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
    expect(
      screen.queryByRole('link', { name: /call customer/i })
    ).toBeNull();
    expect(
      screen.queryByRole('link', { name: /email customer/i })
    ).toBeNull();
  });
});
