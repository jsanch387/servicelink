import { buildQuoteRequestNote } from '@/features/quotes/public-request/buildQuoteRequestNote';
import type { ValidatedPublicQuoteRequestBody } from '@/features/quotes/public-request/validatePublicQuoteRequestBody';
import type { SupabaseClient } from '@supabase/supabase-js';

export type InsertCustomerQuoteRequestResult =
  | { ok: true; quoteId: string }
  | { ok: false; error: string };

/**
 * Inserts a `quotes` row for a public “request quote” submission.
 * Uses service/admin client (bypasses RLS). Caller must have resolved `businessId`.
 */
export async function insertCustomerQuoteRequest(
  admin: SupabaseClient,
  businessId: string,
  data: ValidatedPublicQuoteRequestBody
): Promise<InsertCustomerQuoteRequestResult> {
  const requestMessage = buildQuoteRequestNote(data.details, data.timeline);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;

  const requestedAt = new Date().toISOString();

  const { data: rows, error } = await db
    .from('quotes')
    .insert({
      business_id: businessId,
      created_by_user_id: null,
      /** Required when `source = customer_requested` (see `chk_quotes_requested_has_timestamp`). */
      requested_at: requestedAt,
      customer_name: data.customerName,
      customer_email: data.customerEmail,
      customer_phone: data.customerPhoneDigits,
      vehicle_year: data.vehicleYear,
      vehicle_make: data.vehicleMake,
      vehicle_model: data.vehicleModel,
      service_name: data.serviceName,
      price_cents: 0,
      duration_minutes: 60,
      note: null,
      request_message: requestMessage,
      scheduled_date: null,
      scheduled_start_time: null,
      status: 'requested',
      source: 'customer_requested',
    })
    .select('id');

  const row = rows?.[0] as { id: string } | undefined;

  if (error) {
    console.error('[insertCustomerQuoteRequest] insert/select failed', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return {
      ok: false,
      error: 'Could not save your request. Please try again.',
    };
  }

  if (!row?.id) {
    console.error(
      '[insertCustomerQuoteRequest] no row returned (check RLS, table name, and DB constraints)'
    );
    return {
      ok: false,
      error: 'Could not save your request. Please try again.',
    };
  }

  return { ok: true, quoteId: row.id };
}
