import type Stripe from 'stripe';
import { applyPaymentsTransactionDisplay } from './applyPaymentsTransactionDisplay';
import type {
  PaymentsTransactionKind,
  PaymentsTransactionSource,
  PaymentsTransactionTone,
} from './constants';

const SKIP_TYPES = new Set([
  'stripe_fee',
  'stripe_fx_fee',
  'application_fee',
  'application_fee_refund',
]);

export interface PaymentsTransactionRefs {
  paymentIntentId?: string;
  paymentRequestId?: string;
  bookingId?: string;
  bookingCheckoutSessionRowId?: string;
  membershipPlanId?: string;
  metadataKind?: string;
  note?: string;
  cardBrand?: string;
  cardLast4?: string;
  customerName?: string;
  payoutArrivalUnix?: number;
  payoutStatus?: string;
  bankLast4?: string;
  sourceDescription?: string;
}

export interface MappedPaymentsTransaction {
  id: string;
  kind: PaymentsTransactionKind;
  status: string;
  amountCents: number;
  netCents: number;
  feeCents: number;
  displayAmountCents: number;
  currency: string;
  createdAt: string;
  availableOn: string | null;
  title: string;
  subtitle: string | null;
  description: string | null;
  source: PaymentsTransactionSource;
  methodLabel: string;
  customerName: string | null;
  bookingId: string | null;
  paymentRequestId: string | null;
  payoutArrivalAt: string | null;
  extraCount: number;
  serviceName: string | null;
  jobCount: number;
  bankLast4: string | null;
  cardLast4: string | null;
  tone: PaymentsTransactionTone;
  amountLabel: string;
  statusLabel: string;
  dateLabel: string;
  feeLabel: string | null;
  refs: PaymentsTransactionRefs;
}

export function shouldSkipBalanceTransactionType(type: string): boolean {
  return SKIP_TYPES.has(type);
}

export function mapBalanceTransactionKind(
  type: string
): PaymentsTransactionKind | null {
  if (shouldSkipBalanceTransactionType(type)) return null;
  if (type === 'refund' || type === 'payment_refund') return 'refund';
  if (
    type === 'payout' ||
    type === 'payout_cancel' ||
    type === 'payout_failure'
  ) {
    return 'payout';
  }
  if (
    type === 'charge' ||
    type === 'payment' ||
    type === 'payment_failure_refund'
  ) {
    return 'payment';
  }
  return null;
}

export function extractPaymentsTransactionRefs(
  txn: Stripe.BalanceTransaction
): PaymentsTransactionRefs {
  const source = txn.source;
  const refs: PaymentsTransactionRefs = {};
  if (!source || typeof source === 'string') {
    return refs;
  }

  const metadata = 'metadata' in source ? source.metadata : undefined;
  refs.metadataKind =
    typeof metadata?.kind === 'string' ? metadata.kind.trim() : undefined;
  refs.note =
    typeof metadata?.note === 'string' ? metadata.note.trim() : undefined;
  refs.paymentRequestId =
    typeof metadata?.paymentRequestId === 'string'
      ? metadata.paymentRequestId.trim()
      : undefined;
  refs.bookingId =
    typeof metadata?.bookingId === 'string'
      ? metadata.bookingId.trim()
      : undefined;
  refs.bookingCheckoutSessionRowId =
    typeof metadata?.bookingCheckoutSessionId === 'string'
      ? metadata.bookingCheckoutSessionId.trim()
      : undefined;
  refs.membershipPlanId =
    typeof metadata?.membershipPlanId === 'string'
      ? metadata.membershipPlanId.trim()
      : undefined;
  if (!refs.customerName && typeof metadata?.customerEmail === 'string') {
    refs.customerName = metadata.customerEmail.trim() || undefined;
  }

  if ('description' in source && typeof source.description === 'string') {
    refs.sourceDescription = source.description.trim() || undefined;
  }

  if (source.object === 'charge') {
    const charge = source as Stripe.Charge;
    refs.paymentIntentId = stripeId(charge.payment_intent);
    refs.customerName =
      charge.billing_details?.name?.trim() ||
      charge.billing_details?.email?.trim() ||
      refs.customerName;
    const card = charge.payment_method_details?.card;
    refs.cardBrand = card?.brand?.trim() || undefined;
    refs.cardLast4 = card?.last4?.trim() || undefined;
  }

  if (source.object === 'refund') {
    const refund = source as Stripe.Refund;
    refs.paymentIntentId = stripeId(refund.payment_intent);
    if (
      !refs.paymentIntentId &&
      refund.charge &&
      typeof refund.charge === 'object'
    ) {
      refs.paymentIntentId = stripeId(refund.charge.payment_intent);
    }
  }

  if (source.object === 'payout') {
    const payout = source as Stripe.Payout;
    refs.payoutArrivalUnix =
      typeof payout.arrival_date === 'number' ? payout.arrival_date : undefined;
    refs.payoutStatus = payout.status?.trim() || undefined;
    const dest = payout.destination;
    if (dest && typeof dest === 'object' && 'last4' in dest) {
      const last4 = (dest as { last4?: string | null }).last4?.trim();
      refs.bankLast4 = last4 || undefined;
    }
  }

  return refs;
}

export function mapStripeBalanceTransaction(
  txn: Stripe.BalanceTransaction
): MappedPaymentsTransaction | null {
  const kind = mapBalanceTransactionKind(txn.type);
  if (!kind) return null;

  const refs = extractPaymentsTransactionRefs(txn);
  const currency = (txn.currency || 'usd').toLowerCase();
  const amountCents = txn.amount;
  const netCents = txn.net;
  const feeCents = Math.max(0, txn.fee ?? 0);
  const displayAmountCents =
    kind === 'payout' ? Math.abs(amountCents) : netCents;

  const source = sourceFromKind(kind, refs.metadataKind);
  const methodLabel = methodLabelFor(kind, source, refs);
  const title = titleFor(kind, refs, txn.description);
  const payoutArrivalAt = unixToIso(refs.payoutArrivalUnix);
  const status = statusFor(kind, txn.status, refs.payoutStatus);
  const subtitle = subtitleFor({
    kind,
    refs,
    methodLabel,
  });

  return applyPaymentsTransactionDisplay({
    id: txn.id,
    kind,
    status,
    amountCents,
    netCents,
    feeCents,
    displayAmountCents,
    currency,
    createdAt: unixToIso(txn.created) ?? new Date().toISOString(),
    availableOn: unixToIso(txn.available_on),
    title,
    subtitle,
    description: txn.description?.trim() || refs.sourceDescription || null,
    source,
    methodLabel,
    customerName: refs.customerName ?? null,
    bookingId: refs.bookingId ?? null,
    paymentRequestId: refs.paymentRequestId ?? null,
    payoutArrivalAt,
    extraCount: 0,
    serviceName: null,
    jobCount: 0,
    bankLast4: null,
    cardLast4: null,
    tone: 'in',
    amountLabel: '',
    statusLabel: '',
    dateLabel: '',
    feeLabel: null,
    refs,
  });
}

function sourceFromKind(
  kind: PaymentsTransactionKind,
  metadataKind?: string
): PaymentsTransactionSource {
  if (kind === 'payout') return 'payout';
  if (
    metadataKind === 'walkup_tap_to_pay' ||
    metadataKind === 'booking_tap_to_pay'
  ) {
    return metadataKind === 'walkup_tap_to_pay' ? 'tap_to_pay' : 'booking';
  }
  if (metadataKind === 'walkup_payment_link') return 'payment_link';
  if (metadataKind === 'booking_checkout') return 'booking';
  if (
    metadataKind === 'membership_checkout' ||
    metadataKind === 'membership_invoice'
  ) {
    return 'membership';
  }
  return 'other';
}

function methodLabelFor(
  kind: PaymentsTransactionKind,
  source: PaymentsTransactionSource,
  refs: PaymentsTransactionRefs
): string {
  if (kind === 'payout') return 'Bank deposit';
  if (kind === 'refund') return 'Refund';
  if (source === 'tap_to_pay') return 'Tap to pay';
  if (source === 'payment_link') return 'Payment link';
  if (source === 'cash') return 'Cash';
  if (source === 'payment_app') return 'Payment app';
  if (source === 'booking' && refs.metadataKind === 'booking_tap_to_pay') {
    return 'Tap to pay';
  }
  if (source === 'booking') return 'Card';
  if (source === 'membership') return 'Membership';
  return 'Card';
}

function titleFor(
  kind: PaymentsTransactionKind,
  refs: PaymentsTransactionRefs,
  stripeDescription: string | null
): string {
  if (refs.note) return refs.note;
  if (kind === 'payout') return 'Payout';
  if (kind === 'refund') return 'Refund';
  if (
    refs.metadataKind === 'membership_checkout' ||
    refs.metadataKind === 'membership_invoice'
  ) {
    return 'Membership';
  }
  const fromSource = refs.sourceDescription || stripeDescription?.trim();
  if (fromSource && !isGenericStripeDescription(fromSource)) {
    return fromSource;
  }
  return 'Payment';
}

function subtitleFor(args: {
  kind: PaymentsTransactionKind;
  refs: PaymentsTransactionRefs;
  methodLabel: string;
}): string | null {
  if (args.kind === 'payout') {
    return '';
  }
  if (args.refs.customerName) {
    return `${args.refs.customerName} · ${args.methodLabel}`;
  }
  return args.methodLabel;
}

function statusFor(
  kind: PaymentsTransactionKind,
  txnStatus: string | null | undefined,
  payoutStatus?: string
): string {
  if (kind === 'payout' && payoutStatus) {
    if (payoutStatus === 'in_transit') return 'in_transit';
    if (payoutStatus === 'paid') return 'paid';
    if (payoutStatus === 'failed' || payoutStatus === 'canceled') {
      return payoutStatus;
    }
    return 'pending';
  }
  return txnStatus === 'pending' ? 'pending' : 'available';
}

function stripeId(
  value: string | { id?: string } | null | undefined
): string | undefined {
  if (typeof value === 'string') {
    const id = value.trim();
    return id || undefined;
  }
  const id = value?.id?.trim();
  return id || undefined;
}

function unixToIso(unix?: number | null): string | null {
  if (typeof unix !== 'number' || !Number.isFinite(unix) || unix <= 0) {
    return null;
  }
  return new Date(unix * 1000).toISOString();
}

function isGenericStripeDescription(value: string): boolean {
  const lower = value.toLowerCase();
  return (
    lower === 'charge' ||
    lower === 'payment' ||
    lower === 'refund' ||
    lower === 'mixed jobs' ||
    lower === 'double jobs' ||
    lower.startsWith('stripe payout')
  );
}
