import { BookingPaymentSuccess } from '@/features/availability/booking/components/BookingPaymentSuccess';
import { cleanup, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/components/shared', () => ({
  GlassCard: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="glass-card" className={className}>
      {children}
    </div>
  ),
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

afterEach(() => {
  cleanup();
});

const defaultProps = {
  businessName: 'Acme Detail',
  businessSlug: 'acme',
  serviceName: 'Full detail — SUV',
  scheduledDate: '2026-06-15',
  startTime: '09:00',
  currency: 'usd',
  paidOnlineAmountCents: 50_00,
  remainingAmountCents: 100_00,
  paymentStatus: 'deposit_paid',
  totalAmountCents: 150_00,
  durationMinutes: 120,
  servicePriceCents: 100_00,
  selectedAddOns: [
    { id: 'a1', name: 'Pet hair', priceCents: 50_00, durationMinutes: 30 },
  ],
  customerVehicleYear: null,
  customerVehicleMake: null,
  customerVehicleModel: null,
};

describe('BookingPaymentSuccess', () => {
  it('shows deposit copy and ServiceLink payment amounts', () => {
    render(<BookingPaymentSuccess {...defaultProps} />);
    expect(screen.getByRole('heading', { name: /Deposit received/i })).toBeTruthy();
    expect(screen.getByText(/deposit was received through ServiceLink/i)).toBeTruthy();
    expect(screen.getByText(/Paid now/i)).toBeTruthy();
    expect(screen.getAllByText(/\$50\.00/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Remaining/i)).toBeTruthy();
    expect(screen.getAllByText(/\$100\.00/).length).toBeGreaterThanOrEqual(1);
  });

  it('shows paid-in-full headline when paymentStatus is paid_full', () => {
    render(
      <BookingPaymentSuccess
        {...defaultProps}
        paymentStatus="paid_full"
        paidOnlineAmountCents={150_00}
        remainingAmountCents={0}
      />
    );
    expect(screen.getByText(/paid in full through ServiceLink/i)).toBeTruthy();
  });

  it('links back to the public profile slug', () => {
    render(<BookingPaymentSuccess {...defaultProps} />);
    const link = screen.getByRole('link', { name: /back to profile/i });
    expect(link.getAttribute('href')).toBe('/acme');
  });
});
