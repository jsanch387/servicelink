import type {
  SubscriptionCadenceOption,
  SubscriptionCadenceUnit,
} from './customerSubscriptionPlan';

/** Owner dashboard plan draft / mock list item (UI only for now). */
export interface OwnerSubscriptionPlan {
  id: string;
  name: string;
  description: string;
  /** Bullet lines extracted from the description (public card). */
  benefits: string[];
  /** How long each membership visit lasts (minutes). */
  visitDurationMinutes: number;
  cadenceOptions: SubscriptionCadenceOption[];
  createdAt: string;
  /**
   * Stored as true for all live plans. Hide/remove will be delete later —
   * no owner publish toggle in the product.
   */
  isPublished: boolean;
  /** Active subscribers on this plan (live from customer_memberships). */
  activeSubscriberCount: number;
}

export type OwnerSubscriberStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'unpaid'
  | 'paused'
  | 'canceled'
  | 'incomplete';

/** Whether this billing period still needs a calendar visit. */
export type OwnerSubscriberVisitStatus =
  | 'needs_visit'
  | 'scheduled'
  | 'completed'
  | 'none';

/** Customer subscriber row for owner UI (from customer_memberships). */
export interface OwnerSubscriber {
  id: string;
  customerName: string;
  email: string;
  phone?: string;
  /** Linked CRM customer when known. */
  customerId?: string | null;
  planId: string;
  planName: string;
  /** Plan was soft-deleted after this membership ended. */
  planRemoved?: boolean;
  /** Plan visit length for Book visit prefill. */
  visitDurationMinutes?: number;
  cadenceLabel: string;
  /** Billing interval from Stripe / membership row (for price suffix). */
  intervalUnit: SubscriptionCadenceUnit;
  intervalCount: number;
  amountCents: number;
  status: OwnerSubscriberStatus;
  /** ISO date (YYYY-MM-DD) when the subscription started. */
  startedAt: string;
  nextBillingAt: string | null;
  /** True when cancel was requested but access continues until period end. */
  cancelAtPeriodEnd?: boolean;
  /** Last successful/failed charge label for owner support context. */
  lastPaymentLabel?: string;
  /** Card on file, e.g. "Visa ••4242". */
  paymentMethodLabel?: string;
  /** Owner-only preferences (e.g. Saturdays ~8am). */
  notes?: string | null;
  visitStatus: OwnerSubscriberVisitStatus;
  periodVisitBookingId?: string | null;
  /** YYYY-MM-DD when a period visit is scheduled. */
  periodVisitDate?: string | null;
  /** HH:mm when a period visit is scheduled. */
  periodVisitTime?: string | null;
}

export type OwnerCadencePresetId = 'weekly' | 'biweekly' | 'monthly';

export interface OwnerCadencePreset {
  id: OwnerCadencePresetId;
  label: string;
  intervalUnit: SubscriptionCadenceUnit;
  intervalCount: number;
}

export const OWNER_CADENCE_PRESETS: OwnerCadencePreset[] = [
  {
    id: 'weekly',
    label: 'Weekly',
    intervalUnit: 'week',
    intervalCount: 1,
  },
  {
    id: 'biweekly',
    label: 'Every 2 weeks',
    intervalUnit: 'week',
    intervalCount: 2,
  },
  {
    id: 'monthly',
    label: 'Monthly',
    intervalUnit: 'month',
    intervalCount: 1,
  },
];

export type CreatePlanWizardStep = 'name' | 'cadence' | 'description';

export type OwnerSubscriptionsSetupPhase = 'create_first' | 'list';

export type OwnerSubscriptionsListTab = 'plans' | 'subscribers';
