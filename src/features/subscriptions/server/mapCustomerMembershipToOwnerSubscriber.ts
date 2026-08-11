import type { Database } from '@/libs/supabase/client';
import type { SubscriptionCadenceUnit } from '../types/customerSubscriptionPlan';
import type {
  OwnerSubscriber,
  OwnerSubscriberStatus,
} from '../types/ownerSubscriptionPlan';
import { formatCadenceOptionLabel } from '../utils/formatSubscriptionPrice';
import { formatMembershipPaymentMethodLabel } from './membershipPaymentMethodSnapshot';

type MembershipRow =
  Database['public']['Tables']['customer_memberships']['Row'];

const CADENCE_UNITS = new Set<SubscriptionCadenceUnit>([
  'week',
  'month',
  'year',
]);

function asCadenceUnit(
  value: string | null | undefined
): SubscriptionCadenceUnit {
  if (value && CADENCE_UNITS.has(value as SubscriptionCadenceUnit)) {
    return value as SubscriptionCadenceUnit;
  }
  return 'month';
}

/** Map Stripe / DB status → owner UI status. */
export function mapMembershipStatusToOwner(
  status: string | null | undefined
): OwnerSubscriberStatus {
  switch ((status ?? '').trim()) {
    case 'active':
      return 'active';
    case 'trialing':
      return 'trialing';
    case 'past_due':
      return 'past_due';
    case 'unpaid':
      return 'unpaid';
    case 'paused':
      return 'paused';
    case 'canceled':
    case 'incomplete_expired':
      return 'canceled';
    case 'incomplete':
      return 'incomplete';
    default:
      return 'incomplete';
  }
}

function isoToDateLabel(iso: string | null | undefined): string | null {
  if (!iso?.trim()) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function formatPaidDateLabel(iso: string | null | undefined): string | null {
  if (!iso?.trim()) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function formatLastPaymentLabel(args: {
  invoiceStatus?: string | null;
  paidAtIso?: string | null;
  amountPaidCents?: number | null;
}): string | undefined {
  const status = (args.invoiceStatus ?? '').trim();
  const paidDate = formatPaidDateLabel(args.paidAtIso);
  if (status === 'paid' || args.paidAtIso) {
    return paidDate ? `Paid ${paidDate}` : 'Paid';
  }
  if (!status) return undefined;
  if (status === 'open') return 'Open invoice';
  if (status === 'uncollectible') return 'Uncollectible';
  if (status === 'void') return 'Void';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function displayCustomerName(row: MembershipRow): string {
  const name = row.customer_name?.trim();
  if (name) return name;
  const email = row.customer_email?.trim();
  if (email) {
    const local = email.split('@')[0]?.trim();
    if (local) return local;
  }
  return 'Customer';
}

/**
 * Stripe may schedule end via `cancel_at_period_end` OR a concrete `cancel_at`
 * (Customer Portal often uses the latter). Treat either as “ending”.
 */
export function isMembershipCancelScheduled(row: {
  cancel_at_period_end?: boolean | null;
  cancel_at?: string | null;
  status?: string | null;
}): boolean {
  const status = (row.status ?? '').trim();
  if (status === 'canceled' || status === 'incomplete_expired') return false;
  if (row.cancel_at_period_end) return true;
  const cancelAt = row.cancel_at?.trim();
  if (!cancelAt) return false;
  const t = new Date(cancelAt).getTime();
  return Number.isFinite(t) && t > Date.now();
}

export function mapCustomerMembershipToOwnerSubscriber(
  row: MembershipRow,
  planName: string,
  extras?: {
    lastPaymentLabel?: string | null;
  }
): OwnerSubscriber {
  const intervalUnit = asCadenceUnit(row.interval_unit);
  const intervalCount =
    typeof row.interval_count === 'number' && row.interval_count >= 1
      ? row.interval_count
      : 1;

  const paymentMethodLabel = formatMembershipPaymentMethodLabel(
    row.payment_method_brand,
    row.payment_method_last4
  );

  const status = mapMembershipStatusToOwner(row.status);
  const cancelScheduled = isMembershipCancelScheduled(row);

  return {
    id: row.id,
    customerName: displayCustomerName(row),
    email: row.customer_email?.trim() || '—',
    phone: row.customer_phone?.trim() || undefined,
    planId: row.plan_id?.trim() || '',
    planName: planName.trim() || 'Plan',
    cadenceLabel: formatCadenceOptionLabel({ intervalUnit, intervalCount }),
    amountCents: Math.max(0, Math.round(row.amount_cents ?? 0)),
    status,
    startedAt: isoToDateLabel(row.created_at) ?? row.created_at.slice(0, 10),
    // Prefer scheduled cancel date when Stripe set cancel_at without period end.
    nextBillingAt:
      isoToDateLabel(row.cancel_at) ?? isoToDateLabel(row.current_period_end),
    cancelAtPeriodEnd: cancelScheduled,
    lastPaymentLabel:
      extras?.lastPaymentLabel?.trim() ||
      formatLastPaymentLabel({ invoiceStatus: row.last_invoice_status }) ||
      undefined,
    paymentMethodLabel,
  };
}
