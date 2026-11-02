import { describe, expect, it } from 'vitest';

import { invoiceDraftFromBooking } from '../utils/invoiceDraftFromBooking';

describe('invoiceDraftFromBooking', () => {
  it('fills the customer and each service on the appointment', () => {
    const draft = invoiceDraftFromBooking({
      customerName: 'Jesus Sanchez',
      customerEmail: 'Jesus@Example.com',
      customerPhone: '15807545207',
      serviceName: 'Ignored when jobs exist',
      servicePriceCents: 100,
      addonDetails: [],
      jobDetails: [
        {
          serviceName: 'Full detail',
          servicePriceOptionLabel: 'SUV',
          servicePriceCents: 15000,
          selectedAddOns: [{ id: 'a1', name: 'Pet hair', priceCents: 2500 }],
        },
        {
          serviceName: 'Interior shampoo',
          servicePriceCents: 5000,
          selectedAddOns: [],
        },
      ],
      discountCents: 0,
      discountLabel: null,
    });

    expect(draft.customerName).toBe('Jesus Sanchez');
    expect(draft.customerEmail).toBe('jesus@example.com');
    expect(draft.customerPhone).toBe('5807545207');
    expect(draft.dueDate).toBe('');
    expect(draft.lines.map(line => [line.description, line.amount])).toEqual([
      ['Full detail (SUV)', '150'],
      ['Pet hair', '25'],
      ['Interior shampoo', '50'],
    ]);
  });

  it('uses the top-level service when the appointment has no job list', () => {
    const draft = invoiceDraftFromBooking({
      customerName: 'Alex',
      customerEmail: null,
      customerPhone: null,
      serviceName: 'Wash',
      servicePriceCents: 4000,
      addonDetails: [{ id: 'wax', name: 'Wax', priceCents: 1500 }],
      jobDetails: null,
      discountCents: 500,
      discountLabel: 'Spring sale',
    });

    expect(draft.note).toBe('Spring sale');
    expect(draft.lines.map(line => [line.description, line.amount])).toEqual([
      ['Wash', '40'],
      ['Wax', '10'],
    ]);
  });
});
