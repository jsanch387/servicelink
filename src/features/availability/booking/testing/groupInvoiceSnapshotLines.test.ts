import { describe, expect, it } from 'vitest';
import { groupInvoiceSnapshotLines } from '@/features/availability/booking/utils/groupInvoiceSnapshotLines';

describe('groupInvoiceSnapshotLines', () => {
  it('groups service, add-ons, and extra charges in order', () => {
    const groups = groupInvoiceSnapshotLines([
      { kind: 'addon', label: 'Odor removal', amountCents: 2500 },
      { kind: 'service', label: 'Full Detail', amountCents: 12000 },
      { kind: 'session_fee', label: 'Pet hair', amountCents: 1500 },
      { kind: 'addon', label: 'Engine bay', amountCents: 3000 },
    ]);

    expect(groups.map(group => group.id)).toEqual([
      'service',
      'addon',
      'session_fee',
    ]);
    expect(groups[1]?.title).toBe('Add-ons');
    expect(groups[1]?.subtotalCents).toBe(5500);
    expect(groups[2]?.title).toBe('Extra charge');
  });

  it('uses singular titles for single add-on or extra charge', () => {
    const groups = groupInvoiceSnapshotLines([
      { kind: 'service', label: 'Wash', amountCents: 4500 },
      { kind: 'addon', label: 'Wax', amountCents: 2000 },
      { kind: 'session_fee', label: 'Travel fee', amountCents: 1000 },
    ]);

    expect(groups[1]?.title).toBe('Add-on');
    expect(groups[2]?.title).toBe('Extra charge');
  });

  it('places discount after other charge groups', () => {
    const groups = groupInvoiceSnapshotLines([
      { kind: 'service', label: 'Wash', amountCents: 10000 },
      { kind: 'discount', label: 'Summer Sale — $25 off', amountCents: 2500 },
      { kind: 'addon', label: 'Wax', amountCents: 2000 },
    ]);

    expect(groups.map(group => group.id)).toEqual([
      'service',
      'addon',
      'discount',
    ]);
    expect(groups[2]).toMatchObject({
      id: 'discount',
      title: 'Discount',
      subtotalCents: 2500,
    });
  });
});
