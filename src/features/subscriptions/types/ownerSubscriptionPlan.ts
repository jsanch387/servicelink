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
  cadenceOptions: SubscriptionCadenceOption[];
  createdAt: string;
  /**
   * Stored as true for all live plans. Hide/remove will be delete later —
   * no owner publish toggle in the product.
   */
  isPublished: boolean;
}

export type OwnerSubscriberStatus = 'active' | 'past_due' | 'canceled';

/** Mock customer subscriber row for owner UI. */
export interface OwnerSubscriber {
  id: string;
  customerName: string;
  email: string;
  phone?: string;
  planId: string;
  planName: string;
  cadenceLabel: string;
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
