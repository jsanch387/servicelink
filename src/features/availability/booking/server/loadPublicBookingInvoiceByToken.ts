import type { SupabaseClient } from '@supabase/supabase-js';
import type { BookingInvoiceSnapshot } from './buildInvoiceSnapshot';
import { invoiceSnapshotNeedsBusinessHydration } from '../utils/invoiceSnapshotBusiness';
import { loadBusinessProfileForInvoice } from './loadBusinessProfileForInvoice';
import { isValidInvoiceShortCode } from './generateInvoiceShortCode';

export type PublicInvoiceLoadReason = 'not_found' | 'invalid_token' | 'error';

export interface PublicInvoiceContext {
  publicToken: string;
  shortCode: string | null;
  snapshot: BookingInvoiceSnapshot;
  subtotalCents: number;
  totalCents: number;
  paidCents: number;
  status: string;
}

export type LoadPublicBookingInvoiceResult =
  | { ok: true; invoice: PublicInvoiceContext }
  | { ok: false; reason: PublicInvoiceLoadReason };

function isSnapshot(value: unknown): value is BookingInvoiceSnapshot {
  return (
    !!value &&
    typeof value === 'object' &&
    (value as BookingInvoiceSnapshot).version === 1 &&
    Array.isArray((value as BookingInvoiceSnapshot).lines)
  );
}

async function hydrateInvoiceSnapshotBusiness(
  admin: SupabaseClient,
  snapshot: BookingInvoiceSnapshot
): Promise<BookingInvoiceSnapshot> {
  if (!invoiceSnapshotNeedsBusinessHydration(snapshot)) {
    return snapshot;
  }

  const businessId = snapshot.business.id?.trim();
  if (!businessId) {
    return snapshot;
  }

  const business = await loadBusinessProfileForInvoice(admin, businessId);
  if (business.name === 'Your provider' && !business.profileUrl) {
    return snapshot;
  }

  return {
    ...snapshot,
    business: {
      ...snapshot.business,
      name: business.name,
      profileUrl: business.profileUrl ?? snapshot.business.profileUrl,
    },
  };
}

type InvoiceRow = {
  public_token?: string;
  short_code?: string | null;
  snapshot_json?: unknown;
  subtotal_cents?: number;
  total_cents?: number;
  paid_cents?: number;
  status?: string;
  business_id?: string;
  booking_id?: string;
};

async function withMembershipCoverage(
  admin: SupabaseClient,
  snapshot: BookingInvoiceSnapshot,
  bookingId: string | null
): Promise<BookingInvoiceSnapshot> {
  if (snapshot.coveredByMembership === true) return snapshot;
  const id = bookingId?.trim();
  if (!id) return snapshot;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any)
    .from('booking_payments')
    .select('payment_method_selected')
    .eq('booking_id', id)
    .maybeSingle();

  const method = String(
    (data as { payment_method_selected?: string | null } | null)
      ?.payment_method_selected ?? ''
  ).trim();
  if (method !== 'membership') return snapshot;

  const payments = snapshot.payments.some(p => p.kind === 'membership')
    ? snapshot.payments
    : [
        ...snapshot.payments,
        {
          kind: 'membership' as const,
          label: 'Covered by membership',
          amountCents: 0,
        },
      ];

  return { ...snapshot, coveredByMembership: true, payments };
}

async function mapInvoiceRow(
  admin: SupabaseClient,
  data: InvoiceRow
): Promise<LoadPublicBookingInvoiceResult> {
  const publicToken = String(data.public_token ?? '').trim();
  if (!publicToken) {
    return { ok: false, reason: 'error' };
  }

  const rawSnapshot = data.snapshot_json;
  if (!isSnapshot(rawSnapshot)) {
    return { ok: false, reason: 'error' };
  }

  const businessId =
    rawSnapshot.business.id?.trim() || String(data.business_id ?? '').trim();

  const snapshot = await withMembershipCoverage(
    admin,
    await hydrateInvoiceSnapshotBusiness(admin, {
      ...rawSnapshot,
      business: {
        ...rawSnapshot.business,
        id: businessId || rawSnapshot.business.id,
      },
    }),
    String(data.booking_id ?? '').trim() || null
  );

  const shortCodeRaw = data.short_code;
  const shortCode =
    typeof shortCodeRaw === 'string' && shortCodeRaw.trim()
      ? shortCodeRaw.trim()
      : null;

  return {
    ok: true,
    invoice: {
      publicToken,
      shortCode,
      snapshot,
      subtotalCents: Number(data.subtotal_cents ?? 0),
      totalCents: Number(data.total_cents ?? 0),
      paidCents: Number(data.paid_cents ?? 0),
      status: String(data.status ?? 'paid'),
    },
  };
}

const INVOICE_SELECT =
  'public_token, short_code, snapshot_json, subtotal_cents, total_cents, paid_cents, status, business_id, booking_id';

export async function loadPublicBookingInvoiceByToken(
  admin: SupabaseClient,
  rawToken: string
): Promise<LoadPublicBookingInvoiceResult> {
  const token = rawToken.trim();
  if (!token || token.length < 16) {
    return { ok: false, reason: 'invalid_token' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('booking_invoices')
    .select(INVOICE_SELECT)
    .eq('public_token', token)
    .maybeSingle();

  if (error) {
    console.error('[invoice] loadPublicBookingInvoiceByToken', error);
    return { ok: false, reason: 'error' };
  }

  if (!data) {
    return { ok: false, reason: 'not_found' };
  }

  return mapInvoiceRow(admin, data as InvoiceRow);
}

export async function loadPublicBookingInvoiceByShortCode(
  admin: SupabaseClient,
  rawCode: string
): Promise<LoadPublicBookingInvoiceResult> {
  const code = rawCode.trim();
  if (!isValidInvoiceShortCode(code)) {
    return { ok: false, reason: 'invalid_token' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('booking_invoices')
    .select(INVOICE_SELECT)
    .eq('short_code', code)
    .maybeSingle();

  if (error) {
    console.error('[invoice] loadPublicBookingInvoiceByShortCode', error);
    return { ok: false, reason: 'error' };
  }

  if (!data) {
    return { ok: false, reason: 'not_found' };
  }

  return mapInvoiceRow(admin, data as InvoiceRow);
}
