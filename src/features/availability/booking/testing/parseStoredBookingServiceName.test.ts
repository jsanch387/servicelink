import { describe, expect, it } from 'vitest';
import {
  normalizeInvoiceSnapshotLines,
  parseStoredBookingServiceName,
} from '@/features/availability/booking/utils/parseStoredBookingServiceName';

describe('parseStoredBookingServiceName', () => {
  it('splits stored service name and pricing option label', () => {
    expect(
      parseStoredBookingServiceName('Full Interior Detail — Large SUV')
    ).toEqual({
      serviceName: 'Full Interior Detail',
      priceOptionLabel: 'Large SUV',
    });
  });

  it('returns the full string when no pricing option separator is present', () => {
    expect(parseStoredBookingServiceName('Express Wash')).toEqual({
      serviceName: 'Express Wash',
      priceOptionLabel: null,
    });
  });
});

describe('normalizeInvoiceSnapshotLines', () => {
  it('adds detailLabel to legacy service lines stored as combined names', () => {
    const lines = normalizeInvoiceSnapshotLines([
      {
        kind: 'service',
        label: 'Full Interior Detail — Large SUV',
        amountCents: 12000,
      },
    ]);

    expect(lines[0]).toEqual({
      kind: 'service',
      label: 'Full Interior Detail',
      detailLabel: 'Large SUV',
      amountCents: 12000,
    });
  });
});
