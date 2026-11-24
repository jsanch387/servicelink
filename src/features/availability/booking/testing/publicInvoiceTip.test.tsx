import { PublicInvoicePageShell } from '@/features/availability/booking/public/components/PublicInvoicePageShell';
import { buildInvoiceSnapshot } from '@/features/availability/booking/server/buildInvoiceSnapshot';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/email/services/resendClient', () => ({
  getAppBaseUrl: () => 'https://myservicelink.app',
}));

afterEach(() => {
  cleanup();
});

const amountDue = {
  serviceCents: 10000,
  addonCents: 0,
  sessionFeeCents: 0,
  subtotalCents: 10000,
  discountCents: 0,
  adjustedTotalCents: 10000,
  paidOnlineCents: 0,
  sessionPayCents: 10000,
  amountDueCents: 0,
  taxCents: 0,
  taxRateBps: 0,
};

function snapshotFor(tipCents?: number) {
  return buildInvoiceSnapshot({
    business: { id: 'biz-1', name: 'Test', businessSlug: 'test' },
    booking: {
      id: 'booking-tip',
      service_name: 'Wash',
      scheduled_date: '2026-08-24',
      start_time: '09:00:00',
      customer_name: 'Sam',
      customer_email: null,
      customer_phone: null,
      service_price_cents: 10000,
      addon_details: [],
    },
    sessionFees: [],
    amountDue,
    sessionPaymentMethod: tipCents ? 'tap_to_pay' : 'cash',
    tipCents,
  });
}

describe('PublicInvoicePageShell tip', () => {
  it('shows the tip under the visit total and the charged amount', () => {
    render(<PublicInvoicePageShell snapshot={snapshotFor(2000)} />);

    expect(screen.getByText('Amount paid')).toBeTruthy();
    expect(screen.getAllByText('$120.00').length).toBeGreaterThan(0);
    expect(screen.getByText('Visit total')).toBeTruthy();
    expect(screen.getAllByText('$100.00').length).toBeGreaterThan(0);
    expect(screen.getByText('Tip')).toBeTruthy();
    expect(screen.getByText('$20.00')).toBeTruthy();
    expect(screen.getByText('Paid at visit')).toBeTruthy();
  });

  it('leaves a receipt with no tip unchanged', () => {
    render(<PublicInvoicePageShell snapshot={snapshotFor()} />);

    expect(screen.getByText('Amount paid')).toBeTruthy();
    expect(screen.getAllByText('$100.00').length).toBeGreaterThan(0);
    expect(screen.queryByText('Tip')).toBeNull();
    expect(screen.queryByText('Visit total')).toBeNull();
    expect(screen.queryByText('$20.00')).toBeNull();
  });
});
