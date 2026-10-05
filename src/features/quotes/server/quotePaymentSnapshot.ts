import { getHasProAccessForPayments } from '@/features/payments/server/getHasProAccessForPayments';
import {
  QUOTE_CARD_MIN_CENTS,
  depositDueCents,
  quoteCustomerPayment,
  type QuoteCustomerPayment,
  type QuotePaymentCollection,
  type QuoteSendPaymentOffer,
} from '@/features/quotes/shared/quotePaymentCollection';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export type QuotePaymentSnapshot = {
  payment_collection: QuotePaymentCollection;
  deposit_type: 'fixed' | 'percent' | null;
  deposit_value: number | null;
};

export type { QuoteSendPaymentOffer };

type CardReadiness = {
  open: boolean;
  depositsEnabled: boolean;
  depositType: 'fixed' | 'percent';
  depositValue: number;
  currency: string;
  stripeAccountId: string | null;
};

function asDepositType(raw: unknown): 'fixed' | 'percent' {
  return raw === 'percent' ? 'percent' : 'fixed';
}

export async function loadQuoteCardReadiness(
  supabase: SupabaseClient<Database>,
  businessId: string
): Promise<CardReadiness> {
  const closed: CardReadiness = {
    open: false,
    depositsEnabled: false,
    depositType: 'fixed',
    depositValue: 0,
    currency: 'usd',
    stripeAccountId: null,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: business } = await db
    .from('business_profiles')
    .select('profile_id')
    .eq('id', businessId)
    .maybeSingle();
  const ownerId = (business as { profile_id?: string | null } | null)
    ?.profile_id;
  if (!ownerId) return closed;

  const hasPro = await getHasProAccessForPayments(supabase, ownerId);
  if (!hasPro) return closed;

  const { data: settings } = await db
    .from('payment_settings')
    .select(
      'payments_enabled, deposits_enabled, deposit_type, deposit_value, currency'
    )
    .eq('business_id', businessId)
    .maybeSingle();
  const settingsRow = settings as {
    payments_enabled?: boolean;
    deposits_enabled?: boolean;
    deposit_type?: string | null;
    deposit_value?: number | null;
    currency?: string | null;
  } | null;
  if (settingsRow?.payments_enabled !== true) return closed;

  const { data: account } = await db
    .from('payment_accounts')
    .select('stripe_account_id, charges_enabled')
    .eq('business_id', businessId)
    .maybeSingle();
  const accountRow = account as {
    stripe_account_id?: string | null;
    charges_enabled?: boolean | null;
  } | null;
  const stripeAccountId = accountRow?.stripe_account_id?.trim() || null;
  if (!stripeAccountId || accountRow?.charges_enabled !== true) return closed;

  const currency = (settingsRow.currency ?? 'usd').trim().toLowerCase();
  return {
    open: true,
    depositsEnabled: settingsRow.deposits_enabled === true,
    depositType: asDepositType(settingsRow.deposit_type),
    depositValue: Number.isFinite(settingsRow.deposit_value)
      ? Number(settingsRow.deposit_value)
      : 0,
    currency: /^[a-z]{3}$/.test(currency) ? currency : 'usd',
    stripeAccountId,
  };
}

export async function loadQuoteSendPaymentOffer(
  supabase: SupabaseClient<Database>,
  businessId: string
): Promise<QuoteSendPaymentOffer> {
  const ready = await loadQuoteCardReadiness(supabase, businessId);
  return {
    available: ready.open,
    depositsEnabled: ready.depositsEnabled,
    depositType: ready.depositType,
    depositValue: ready.depositValue,
  };
}

export async function resolveQuotePaymentSnapshot(
  supabase: SupabaseClient<Database>,
  args: {
    businessId: string;
    priceCents: number;
    requested: QuotePaymentCollection;
  }
): Promise<
  | { ok: true; snapshot: QuotePaymentSnapshot }
  | { ok: false; error: string; status: number }
> {
  if (args.requested === 'none') {
    return {
      ok: true,
      snapshot: {
        payment_collection: 'none',
        deposit_type: null,
        deposit_value: null,
      },
    };
  }

  const ready = await loadQuoteCardReadiness(supabase, args.businessId);
  if (!ready.open) {
    return {
      ok: false,
      status: 400,
      error:
        'Turn on Pro payments before requiring a deposit or payment on a quote.',
    };
  }

  const total = Math.max(0, Math.round(args.priceCents));
  const needsDeposit =
    args.requested === 'deposit' || args.requested === 'customer_choice';
  if (needsDeposit && !ready.depositsEnabled) {
    return {
      ok: false,
      status: 400,
      error: 'Turn on deposits in Payments before requiring a deposit.',
    };
  }

  const due = needsDeposit
    ? depositDueCents(total, ready.depositType, ready.depositValue)
    : 0;
  if (needsDeposit && due < QUOTE_CARD_MIN_CENTS) {
    return {
      ok: false,
      status: 400,
      error:
        'Set a deposit of at least $0.50 in Payments before sending this quote.',
    };
  }
  if (
    (args.requested === 'full' || args.requested === 'customer_choice') &&
    total < QUOTE_CARD_MIN_CENTS
  ) {
    return {
      ok: false,
      status: 400,
      error:
        'The quote total must be at least $0.50 to collect a card payment.',
    };
  }

  if (args.requested === 'full') {
    return {
      ok: true,
      snapshot: {
        payment_collection: 'full',
        deposit_type: null,
        deposit_value: null,
      },
    };
  }

  return {
    ok: true,
    snapshot: {
      payment_collection: args.requested,
      deposit_type: ready.depositType,
      deposit_value: Math.round(ready.depositValue),
    },
  };
}

export async function loadQuoteCustomerPayment(
  supabase: SupabaseClient<Database>,
  quote: {
    business_id: string;
    price_cents: number | null;
    payment_collection?: string | null;
    deposit_type?: string | null;
    deposit_value?: number | null;
  }
): Promise<QuoteCustomerPayment> {
  const collection = quote.payment_collection;
  const parsed: QuotePaymentCollection =
    collection === 'deposit' ||
    collection === 'full' ||
    collection === 'customer_choice'
      ? collection
      : 'none';
  const depositType =
    quote.deposit_type === 'fixed' || quote.deposit_type === 'percent'
      ? quote.deposit_type
      : null;
  const ready =
    parsed === 'none'
      ? null
      : await loadQuoteCardReadiness(supabase, quote.business_id);

  return quoteCustomerPayment({
    collection: parsed,
    priceCents: quote.price_cents ?? 0,
    depositType,
    depositValue:
      quote.deposit_value == null ? null : Number(quote.deposit_value),
    gatesOpen: ready?.open === true,
  });
}
