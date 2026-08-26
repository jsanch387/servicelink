import { describe, expect, it } from 'vitest';
import { mapOfflineSessionPayment } from '../mapOfflineSessionPayment';

describe('mapOfflineSessionPayment', () => {
  it('maps a cash job collection', () => {
    const item = mapOfflineSessionPayment({
      id: 'bp_1',
      bookingId: 'book_1',
      method: 'cash',
      amountCents: 8500,
      currency: 'usd',
      recordedAt: '2026-08-24T17:00:00.000Z',
      customerName: 'Jordan Lee',
      serviceName: 'Lights',
    });

    expect(item).toMatchObject({
      id: 'local_bp_bp_1',
      kind: 'payment',
      source: 'cash',
      title: 'Lights',
      subtitle: 'Jordan Lee · Cash',
      methodLabel: 'Cash',
      displayAmountCents: 8500,
      feeCents: 0,
      tone: 'in',
      amountLabel: '+$85.00',
      statusLabel: 'Paid',
      bookingId: 'book_1',
      customerName: 'Jordan Lee',
    });
  });

  it('uses the first job name and extraCount, without a pricing tier', () => {
    const item = mapOfflineSessionPayment({
      id: 'bp_jobs',
      bookingId: 'book_jobs',
      method: 'cash',
      amountCents: 18900,
      currency: 'usd',
      recordedAt: '2026-08-24T17:00:00.000Z',
      customerName: 'Jordan Lee',
      serviceName: 'Mixed jobs',
      jobDetails: [
        {
          serviceName: 'Signature Shine',
          servicePriceOptionLabel: 'SUV',
          servicePriceCents: 18900,
        },
        { serviceName: 'Interior', servicePriceCents: 8000 },
      ],
    });

    expect(item).toMatchObject({
      title: 'Signature Shine',
      extraCount: 1,
      jobCount: 2,
      serviceName: 'Signature Shine',
      subtitle: 'Jordan Lee · Cash',
    });
    expect(item?.title).not.toContain('SUV');
    expect(item?.title).not.toBe('Mixed jobs');
    expect(item?.title).not.toBe('Double jobs');
  });

  it('maps payment app without a customer name', () => {
    const item = mapOfflineSessionPayment({
      id: 'bp_2',
      bookingId: 'book_2',
      method: 'payment_app',
      amountCents: 4000,
      currency: 'usd',
      recordedAt: '2026-08-24T17:00:00.000Z',
      customerName: null,
      serviceName: null,
    });

    expect(item).toMatchObject({
      source: 'payment_app',
      title: 'Payment',
      subtitle: 'Payment app',
      methodLabel: 'Payment app',
    });
  });

  it('skips zero-amount rows', () => {
    expect(
      mapOfflineSessionPayment({
        id: 'bp_3',
        bookingId: 'book_3',
        method: 'other',
        amountCents: 0,
        currency: 'usd',
        recordedAt: '2026-08-24T17:00:00.000Z',
        customerName: null,
        serviceName: 'Wax',
      })
    ).toBeNull();
  });
});
