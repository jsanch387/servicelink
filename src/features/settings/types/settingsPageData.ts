import type { PlanId } from '@/features/pricing';
import type { BillingInterval } from '@/features/pricing/types';

export interface SettingsPageData {
  businessProfile: {
    id: string;
    business_name: string;
    business_type: string | null;
    service_area: string | null;
    bio: string | null;
    created_at: string;
    updated_at: string;
  };
  slugData: {
    hasSlug: boolean;
    slug?: string;
    fullLink?: string;
  } | null;
  planId?: PlanId;
  subscriptionStatus?: string | null;
  subscriptionCurrentPeriodEnd?: string | null;
  subscriptionCancelAtPeriodEnd?: boolean;
  /** Stripe subscription unit amount when on Pro (e.g. grandfathered $10). */
  subscriptionMonthlyPrice?: string | null;
  /** Stripe recurring interval when on Pro. */
  subscriptionBillingInterval?: BillingInterval | null;
  accountEmail?: string;
  signedInWithGoogle?: boolean;
}
