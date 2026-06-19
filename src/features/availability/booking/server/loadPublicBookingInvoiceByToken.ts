import type { SupabaseClient } from '@supabase/supabase-js';
import type { BookingInvoiceSnapshot } from './buildInvoiceSnapshot';
import { invoiceSnapshotNeedsBusinessHydration } from '../utils/invoiceSnapshotBusiness';
import { loadBusinessProfileForInvoice } from './loadBusinessProfileForInvoice';

export type PublicInvoiceLoadReason =
  | 'not_found'
  | 'invalid_token'
  | 'error';

export interface PublicInvoiceContext {
  publicToken: string;
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
  if (
    business.name === 'Your provider' &&
    !business.profileUrl
  ) {
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
    .select('public_token, snapshot_json, subtotal_cents, total_cents, paid_cents, status, business_id')
    .eq('public_token', token)
    .maybeSingle();

  if (error) {
    console.error('[invoice] loadPublicBookingInvoiceByToken', error);
    return { ok: false, reason: 'error' };
  }

  if (!data) {
    return { ok: false, reason: 'not_found' };
  }

  const rawSnapshot = (data as { snapshot_json?: unknown }).snapshot_json;
  if (!isSnapshot(rawSnapshot)) {
    return { ok: false, reason: 'error' };
  }

  const businessId =
    rawSnapshot.business.id?.trim() ||
    String((data as { business_id?: string }).business_id ?? '').trim();

  const snapshot = await hydrateInvoiceSnapshotBusiness(admin, {
    ...rawSnapshot,
    business: {
      ...rawSnapshot.business,
      id: businessId || rawSnapshot.business.id,
    },
  });

  return {
    ok: true,
    invoice: {
      publicToken: token,
      snapshot,
      subtotalCents: Number((data as { subtotal_cents?: number }).subtotal_cents ?? 0),
      totalCents: Number((data as { total_cents?: number }).total_cents ?? 0),
      paidCents: Number((data as { paid_cents?: number }).paid_cents ?? 0),
      status: String((data as { status?: string }).status ?? 'paid'),
    },
  };
}
