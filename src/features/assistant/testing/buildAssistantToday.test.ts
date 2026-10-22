import { describe, expect, it } from 'vitest';

import {
  REBOOK_CHECKIN_AFTER_DAYS,
  REVIEW_FOLLOWUP_AFTER_DAYS,
  buildAssistantToday,
  type AssistantCustomerInput,
} from '../today/buildAssistantToday';

const NOW = new Date('2026-10-20T15:00:00.000Z');

function customer(
  patch: Partial<AssistantCustomerInput> &
    Pick<AssistantCustomerInput, 'id' | 'fullName'>
): AssistantCustomerInput {
  return {
    phone: '555',
    email: null,
    lastVisitDaysAgo: 10,
    lastVisitBookingId: 'booking-1',
    hasUpcomingAppointment: false,
    hasReview: false,
    ...patch,
  };
}

describe('buildAssistantToday', () => {
  it('builds a review follow-up and a rebook check-in from live customers', () => {
    const today = buildAssistantToday({
      now: NOW,
      bookingUrl: 'https://myservicelink.app/shop/book',
      actions: [],
      customers: [
        customer({
          id: 'jane',
          fullName: 'Jane Doe',
          lastVisitDaysAgo: REVIEW_FOLLOWUP_AFTER_DAYS,
          hasUpcomingAppointment: true,
        }),
        customer({
          id: 'soon',
          fullName: 'Soon Visit',
          lastVisitDaysAgo: REVIEW_FOLLOWUP_AFTER_DAYS - 1,
        }),
        customer({
          id: 'sarah',
          fullName: 'Sarah Lee',
          lastVisitDaysAgo: REBOOK_CHECKIN_AFTER_DAYS + 1,
          hasReview: true,
        }),
        customer({
          id: 'booked',
          fullName: 'Already Booked',
          lastVisitDaysAgo: REBOOK_CHECKIN_AFTER_DAYS + 5,
          hasUpcomingAppointment: true,
          hasReview: true,
        }),
      ],
    });

    expect(today.reviews.map(person => person.firstName)).toEqual(['Jane']);
    expect(today.checkIns.map(person => person.firstName)).toEqual(['Sarah']);
    expect(today.brief.intro.join(' ')).toContain('2 things');
    expect(today.brief.review).toContain('Jane hasn’t left a review yet');
    expect(today.brief.checkIn).toContain('Sarah hasn’t booked in');
    expect(today.checkIns[0]?.body).toContain(
      'https://myservicelink.app/shop/book'
    );
    expect(today.activity).toEqual([]);
  });

  it('hides someone after a skip until a newer undo', () => {
    const sarah = customer({
      id: 'sarah',
      fullName: 'Sarah Lee',
      lastVisitDaysAgo: REBOOK_CHECKIN_AFTER_DAYS + 1,
      hasReview: true,
    });

    const skipped = buildAssistantToday({
      now: NOW,
      bookingUrl: '',
      customers: [sarah],
      actions: [
        {
          id: 'a1',
          customerId: 'sarah',
          customerName: 'Sarah Lee',
          kind: 'skipped',
          subject: 'rebook_checkin',
          createdAt: '2026-10-20T12:00:00.000Z',
        },
      ],
    });
    expect(skipped.checkIns).toEqual([]);
    expect(skipped.activity[0]?.label).toBe('Check-in skipped');
    expect(skipped.activity[0]?.time).toBe('Today');

    const restored = buildAssistantToday({
      now: NOW,
      bookingUrl: '',
      customers: [sarah],
      actions: [
        {
          id: 'a2',
          customerId: 'sarah',
          customerName: 'Sarah Lee',
          kind: 'unskipped',
          subject: 'rebook_checkin',
          createdAt: '2026-10-20T13:00:00.000Z',
        },
        {
          id: 'a1',
          customerId: 'sarah',
          customerName: 'Sarah Lee',
          kind: 'skipped',
          subject: 'rebook_checkin',
          createdAt: '2026-10-20T12:00:00.000Z',
        },
      ],
    });
    expect(restored.checkIns.map(person => person.id)).toEqual([
      'sarah:rebook_checkin',
    ]);
  });

  it('includes quotes with no reply and invoices that are due', () => {
    const today = buildAssistantToday({
      now: NOW,
      bookingUrl: '',
      actions: [],
      customers: [],
      quotes: [
        {
          id: 'q-new',
          customerName: 'New Quote',
          phone: '555',
          email: 'new@example.com',
          amountCents: 15000,
          serviceName: 'Interior detail',
          daysWaiting: 0,
        },
        {
          id: 'q-old',
          customerName: 'Alex Rivera',
          phone: null,
          email: 'alex@example.com',
          amountCents: 18000,
          serviceName: 'Ceramic coating',
          daysWaiting: 4,
        },
      ],
      invoices: [
        {
          id: 'inv-later',
          customerName: 'Future Bill',
          phone: '555',
          email: null,
          amountCents: 9000,
          daysSinceSent: 2,
          daysOverdue: -3,
          payUrl: null,
        },
        {
          id: 'inv-due',
          customerName: 'Sam Ortiz',
          phone: '555',
          email: null,
          amountCents: 24000,
          daysSinceSent: 6,
          daysOverdue: 2,
          payUrl: 'https://myservicelink.app/b/abc',
        },
      ],
    });

    expect(today.quotes.map(person => person.firstName)).toEqual(['Alex']);
    expect(today.quotes[0]?.detail).toContain('$180.00');
    expect(today.invoices.map(person => person.firstName)).toEqual(['Sam']);
    expect(today.invoices[0]?.body).toContain(
      'https://myservicelink.app/b/abc'
    );
    expect(today.brief.quotes).toContain(
      'Alex’s quote has been out for 4 days'
    );
    expect(today.brief.invoices).toContain('Sam’s invoice is still open');
    expect(today.brief.intro.join(' ')).toContain('2 things');
  });

  it('does not store a suggestion when nobody is due', () => {
    const today = buildAssistantToday({
      now: NOW,
      bookingUrl: '',
      actions: [],
      customers: [
        customer({
          id: 'quiet',
          fullName: 'Quiet Customer',
          lastVisitDaysAgo: 1,
          hasUpcomingAppointment: true,
        }),
      ],
    });

    expect(today.reviews).toEqual([]);
    expect(today.checkIns).toEqual([]);
    expect(today.brief.intro[1]).toBe('Nothing is waiting on you right now.');
  });
});
