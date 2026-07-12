import { describe, expect, it, vi } from 'vitest';
import {
  buildInvoiceSnapshot,
  formatBusinessProfileLinkLabel,
  resolveBusinessProfileUrl,
} from '@/features/availability/booking/server/buildInvoiceSnapshot';

vi.mock('@/features/email/services/resendClient', () => ({
  getAppBaseUrl: () => 'https://myservicelink.app',
}));

describe('resolveBusinessProfileUrl', () => {
  it('prefers stored business_link when present', () => {
    expect(
      resolveBusinessProfileUrl({
        businessLink: 'myservicelink.app/black-label-detail',
        businessSlug: 'ignored-slug',
      })
    ).toBe('https://myservicelink.app/black-label-detail');
  });

  it('builds from slug when business_link is missing', () => {
    const url = resolveBusinessProfileUrl({
      businessSlug: 'black-label-detail',
    });
    expect(url).toContain('/black-label-detail');
  });

  it('returns null when no slug or link', () => {
    expect(resolveBusinessProfileUrl({})).toBeNull();
  });
});

describe('formatBusinessProfileLinkLabel', () => {
  it('strips protocol for display', () => {
    expect(
      formatBusinessProfileLinkLabel(
        'https://myservicelink.app/black-label-detail'
      )
    ).toBe('myservicelink.app/black-label-detail');
  });
});

describe('buildInvoiceSnapshot', () => {
  it('builds service, add-on, fee lines and payments with profile URL', () => {
    const snapshot = buildInvoiceSnapshot({
      business: {
        id: 'biz-1',
        name: 'Black Label Detail',
        businessSlug: 'black-label-detail',
      },
      booking: {
        id: 'booking-1',
        service_name: 'Full Interior Detail — Large SUV',
        scheduled_date: '2026-06-18',
        start_time: '14:30:00',
        customer_name: 'Jordan Martinez',
        customer_email: 'jordan@example.com',
        customer_phone: '+15807545207',
        service_price_cents: 12000,
        addon_details: [{ name: 'Odor removal', priceCents: 2500 }],
      },
      sessionFees: [{ label: 'Pet hair removal', amountCents: 2500 }],
      amountDue: {
        serviceCents: 12000,
        addonCents: 2500,
        sessionFeeCents: 2500,
        subtotalCents: 17000,
        discountCents: 0,
        adjustedTotalCents: 17000,
        paidOnlineCents: 5000,
        sessionPayCents: 12000,
        amountDueCents: 0,
      },
      sessionPaymentMethod: 'cash',
      reviewRawToken: 'review-token-abc',
    });

    expect(snapshot.business.profileUrl).toBe(
      'https://myservicelink.app/black-label-detail'
    );
    expect(snapshot.booking.serviceName).toBe('Full Interior Detail');
    expect(snapshot.booking.servicePriceOptionLabel).toBe('Large SUV');
    expect(snapshot.lines).toHaveLength(3);
    expect(snapshot.lines[0]).toMatchObject({
      kind: 'service',
      label: 'Full Interior Detail',
      detailLabel: 'Large SUV',
      amountCents: 12000,
    });
    expect(snapshot.payments).toHaveLength(2);
    expect(snapshot.totals.totalCents).toBe(17000);
    expect(snapshot.totals.discountCents).toBe(0);
    expect(snapshot.reviewUrl).toContain('/review/review-token-abc');
  });

  it('includes a sale/promo discount line after charges', () => {
    const snapshot = buildInvoiceSnapshot({
      business: {
        id: 'biz-1',
        name: 'Black Label Detail',
        businessSlug: 'black-label-detail',
      },
      booking: {
        id: 'booking-2',
        service_name: 'Mobile Detail',
        scheduled_date: '2026-07-14',
        start_time: '10:00:00',
        customer_name: 'Alex Rivera',
        customer_email: 'alex@example.com',
        customer_phone: '+15551234567',
        service_price_cents: 15000,
        addon_details: [],
        discount_label: 'Mobile Sale 2 — $25 off',
      },
      sessionFees: [],
      amountDue: {
        serviceCents: 15000,
        addonCents: 0,
        sessionFeeCents: 0,
        subtotalCents: 15000,
        discountCents: 2500,
        adjustedTotalCents: 12500,
        paidOnlineCents: 0,
        sessionPayCents: 12500,
        amountDueCents: 0,
      },
      sessionPaymentMethod: 'cash',
    });

    expect(snapshot.lines).toEqual([
      {
        kind: 'service',
        label: 'Mobile Detail',
        detailLabel: null,
        amountCents: 15000,
      },
      {
        kind: 'discount',
        label: 'Mobile Sale 2 — $25 off',
        amountCents: 2500,
      },
    ]);
    expect(snapshot.totals).toMatchObject({
      subtotalCents: 15000,
      discountCents: 2500,
      totalCents: 12500,
    });
  });

  it('falls back to Discount label when booking label is missing', () => {
    const snapshot = buildInvoiceSnapshot({
      business: { id: 'biz-1', name: 'Detail Co', businessSlug: 'detail-co' },
      booking: {
        id: 'booking-3',
        service_name: 'Wash',
        scheduled_date: '2026-07-14',
        start_time: '09:00:00',
        customer_name: 'Pat',
        customer_email: null,
        customer_phone: null,
        service_price_cents: 8000,
        addon_details: null,
      },
      sessionFees: [],
      amountDue: {
        serviceCents: 8000,
        addonCents: 0,
        sessionFeeCents: 0,
        subtotalCents: 8000,
        discountCents: 1000,
        adjustedTotalCents: 7000,
        paidOnlineCents: 0,
        sessionPayCents: 7000,
        amountDueCents: 0,
      },
    });

    expect(snapshot.lines.at(-1)).toMatchObject({
      kind: 'discount',
      label: 'Discount',
      amountCents: 1000,
    });
  });
});
