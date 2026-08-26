import { resolveBusinessProfileUrl } from '@/features/availability/booking/server/buildInvoiceSnapshot';
import { MediaService } from '@/features/media/media.service';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import { WALKUP_PAYMENT_STATUS } from './constants';
import { expireOpenWalkUpPaymentIfStripeExpired } from './expireOpenWalkUpPaymentIfStripeExpired';
import { isValidPaymentRequestShortCode } from './generatePaymentRequestShortCode';
import { paymentRequestsOf } from './paymentRequestsQuery';

export type PublicPaymentLinkRecord = {
  id: string;
  status: string;
  amountCents: number;
  currency: string;
  note: string;
  checkoutUrl: string | null;
  businessName: string;
  logoUrl: string | null;
  bookingUrl: string | null;
};

export type LoadPublicPaymentRequestResult =
  | { ok: true; payment: PublicPaymentLinkRecord }
  | { ok: false; reason: 'invalid' | 'not_found' };

export async function loadPublicPaymentRequestByShortCode(
  admin: SupabaseClient<Database>,
  rawCode: string
): Promise<LoadPublicPaymentRequestResult> {
  const code = rawCode.trim();
  if (!isValidPaymentRequestShortCode(code)) {
    return { ok: false, reason: 'invalid' };
  }

  const { data, error } = await paymentRequestsOf(admin)
    .select(
      'id, status, amount_cents, currency, note, stripe_checkout_url, stripe_checkout_session_id, business_id'
    )
    .eq('short_code', code)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, reason: 'not_found' };
  }

  const row = data as {
    id: string;
    status: string;
    amount_cents: number;
    currency: string;
    note: string;
    stripe_checkout_url: string | null;
    stripe_checkout_session_id: string | null;
    business_id: string;
  };

  const status = await expireOpenWalkUpPaymentIfStripeExpired(admin, {
    paymentRequestId: row.id,
    businessId: row.business_id,
    checkoutSessionId: row.stripe_checkout_session_id,
    status: row.status || WALKUP_PAYMENT_STATUS.OPEN,
  });

  const { data: business } = await admin
    .from('business_profiles')
    .select('business_name, logo_path, business_slug, business_link')
    .eq('id', row.business_id)
    .maybeSingle();

  const profile = business as {
    business_name?: string | null;
    logo_path?: string | null;
    business_slug?: string | null;
    business_link?: string | null;
  } | null;
  const businessName = profile?.business_name?.trim() || 'the business';
  const logoPath = profile?.logo_path?.trim() || '';
  const logoUrl = logoPath ? MediaService.getPublicUrl(logoPath) : null;
  const bookingUrl = resolveBusinessProfileUrl({
    businessLink: profile?.business_link,
    businessSlug: profile?.business_slug,
  });

  return {
    ok: true,
    payment: {
      id: row.id,
      status,
      amountCents: row.amount_cents,
      currency: row.currency,
      note: row.note,
      checkoutUrl: row.stripe_checkout_url?.trim() || null,
      businessName,
      logoUrl,
      bookingUrl,
    },
  };
}
