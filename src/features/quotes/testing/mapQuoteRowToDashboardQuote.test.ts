import { mapQuoteRowToDashboardQuote } from '@/features/quotes/dashboard/server/mapQuoteRowToDashboardQuote';
import type { QuoteDbRow } from '@/features/quotes/dashboard/api/types';
import { describe, expect, it } from 'vitest';

function row(partial: Partial<QuoteDbRow> = {}): QuoteDbRow {
  return {
    id: 'q1',
    status: 'viewed',
    source: 'owner_created',
    customer_name: 'Jane',
    customer_email: 'jane@example.com',
    customer_phone: null,
    service_name: 'Wash',
    price_cents: 10000,
    duration_minutes: 60,
    created_at: '2026-09-01T12:00:00.000Z',
    updated_at: '2026-09-02T12:00:00.000Z',
    scheduled_date: null,
    scheduled_start_time: null,
    note: null,
    request_message: null,
    vehicle_year: null,
    vehicle_make: null,
    vehicle_model: null,
    customer_street_address: null,
    customer_unit_apt: null,
    customer_city: null,
    customer_state: null,
    customer_zip: null,
    service_address: null,
    service_id: null,
    service_price_option_id: null,
    service_price_cents: null,
    addon_details: null,
    viewed_at: null,
    customer_reminder_sent_at: null,
    ...partial,
  };
}

describe('mapQuoteRowToDashboardQuote reminder + viewed timestamps', () => {
  it('passes through viewed_at and customer_reminder_sent_at', () => {
    const quote = mapQuoteRowToDashboardQuote(
      row({
        viewed_at: '2026-09-02T15:00:00.000Z',
        customer_reminder_sent_at: '2026-09-03T14:00:00.000Z',
      }),
      'token'
    );
    expect(quote.viewedAt).toBe('2026-09-02T15:00:00.000Z');
    expect(quote.customerReminderSentAt).toBe('2026-09-03T14:00:00.000Z');
    expect(quote.communications).toEqual([]);
  });

  it('attaches email + SMS timeline events', () => {
    const quote = mapQuoteRowToDashboardQuote(row(), 'token', null, [
      {
        channel: 'email',
        type: 'quote_reminder',
        status: 'sent',
        sentAt: '2026-09-03T14:00:00.000Z',
        toAddress: 'jane@example.com',
      },
      {
        channel: 'sms',
        type: 'quote_reminder',
        status: 'sent',
        sentAt: '2026-09-03T14:00:01.000Z',
        toAddress: '5551234567',
      },
    ]);
    expect(quote.communications).toHaveLength(2);
    expect(quote.communications[0]?.channel).toBe('email');
    expect(quote.communications[1]?.channel).toBe('sms');
  });

  it('uses null when the customer has not viewed or been reminded', () => {
    const quote = mapQuoteRowToDashboardQuote(row(), 'token');
    expect(quote.viewedAt).toBeNull();
    expect(quote.customerReminderSentAt).toBeNull();
  });
});
