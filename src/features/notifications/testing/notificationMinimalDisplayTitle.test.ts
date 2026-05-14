import { describe, expect, it } from 'vitest';
import {
  notificationInboxSubtitleFromCustomer,
  notificationMinimalDisplayTitle,
} from '../utils/notificationMinimalDisplayTitle';

describe('notificationMinimalDisplayTitle', () => {
  it('maps known booking / quote / lifecycle types', () => {
    expect(
      notificationMinimalDisplayTitle('availability_booking', 'booking', '')
    ).toBe('New appointment');
    expect(
      notificationMinimalDisplayTitle('booking_request', 'booking_request', '')
    ).toBe('New appointment');
    expect(notificationMinimalDisplayTitle('quote_request', 'quote', '')).toBe(
      'New quote request'
    );
  });

  it('payment failed before generic payment', () => {
    expect(
      notificationMinimalDisplayTitle('stripe', 'payment_failed', 'Something')
    ).toBe('Payment failed');
  });

  it('generic payment-ish blob', () => {
    expect(
      notificationMinimalDisplayTitle('billing', 'deposit_received', '')
    ).toBe('New payment');
  });

  it('generic quote without quote_request stays New quote', () => {
    expect(notificationMinimalDisplayTitle('quote', 'created', '')).toBe(
      'New quote'
    );
  });

  it('quote outcome keywords', () => {
    expect(notificationMinimalDisplayTitle('quote', 'acceptance', '')).toBe(
      'Quote accepted'
    );
    expect(notificationMinimalDisplayTitle('quote', 'declined', '')).toBe(
      'Quote declined'
    );
    expect(notificationMinimalDisplayTitle('quote', 'rejected', '')).toBe(
      'Quote declined'
    );
    expect(notificationMinimalDisplayTitle('quote', 'expired', '')).toBe(
      'Quote expired'
    );
  });

  it('cancel / reschedule / reminder', () => {
    expect(notificationMinimalDisplayTitle('booking', 'cancel', '')).toBe(
      'Appointment canceled'
    );
    expect(notificationMinimalDisplayTitle('booking', 'rescheduled', '')).toBe(
      'Appointment updated'
    );
    expect(notificationMinimalDisplayTitle('booking', 'reschedule', '')).toBe(
      'Appointment updated'
    );
    expect(notificationMinimalDisplayTitle('booking', 'reminder', '')).toBe(
      'Upcoming appointment'
    );
  });

  it('customer / billing', () => {
    expect(
      notificationMinimalDisplayTitle('profile', 'customer_update', '')
    ).toBe('Customer update');
    expect(notificationMinimalDisplayTitle('stripe', 'subscription', '')).toBe(
      'Billing update'
    );
  });

  it('falls back to trimmed title with truncation', () => {
    expect(
      notificationMinimalDisplayTitle('custom', 'event', '  Hello  ')
    ).toBe('Hello');
    const long = 'a'.repeat(60);
    const out = notificationMinimalDisplayTitle('x', 'y', long);
    expect(out.length).toBe(52);
    expect(out.endsWith('…')).toBe(true);
    expect(notificationMinimalDisplayTitle('x', 'y', '   ')).toBe('Update');
  });
});

describe('notificationInboxSubtitleFromCustomer', () => {
  it('returns From line or null', () => {
    expect(notificationInboxSubtitleFromCustomer('  Pat  ')).toBe('From Pat');
    expect(notificationInboxSubtitleFromCustomer(null)).toBe(null);
    expect(notificationInboxSubtitleFromCustomer('')).toBe(null);
  });
});
