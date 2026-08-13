import type { Database } from '@/libs/supabase/client';
import { MEMBERSHIP_VISIT_DURATION_MINUTES_DEFAULT } from '../constants/membershipVisitDuration';
import type {
  CustomerSubscriptionPlan,
  SubscriptionCadenceOption,
  SubscriptionCadenceUnit,
} from '../types/customerSubscriptionPlan';
import type { OwnerSubscriptionPlan } from '../types/ownerSubscriptionPlan';

type PlanRow = Database['public']['Tables']['membership_plans']['Row'];
type PriceRow = Database['public']['Tables']['membership_plan_prices']['Row'];

function planVisitDurationMinutes(plan: PlanRow): number {
  const minutes = plan.visit_duration_minutes;
  if (
    typeof minutes === 'number' &&
    Number.isInteger(minutes) &&
    minutes >= 30
  ) {
    return minutes;
  }
  return MEMBERSHIP_VISIT_DURATION_MINUTES_DEFAULT;
}

const CADENCE_UNITS = new Set<SubscriptionCadenceUnit>([
  'week',
  'month',
  'year',
]);

function asCadenceUnit(value: string): SubscriptionCadenceUnit {
  if (CADENCE_UNITS.has(value as SubscriptionCadenceUnit)) {
    return value as SubscriptionCadenceUnit;
  }
  return 'month';
}

function mapCadenceOptions(prices: PriceRow[]): SubscriptionCadenceOption[] {
  const sorted = [...prices].sort((a, b) => {
    if (a.is_default !== b.is_default) return a.is_default ? -1 : 1;
    return a.created_at.localeCompare(b.created_at);
  });

  return sorted.map(price => ({
    id: price.id,
    intervalUnit: asCadenceUnit(price.interval_unit),
    intervalCount: price.interval_count,
    priceCents: price.price_cents,
    isDefault: price.is_default,
  }));
}

export {
  joinDescriptionAndBenefits,
  splitDescriptionAndBenefits,
} from '../utils/planDescription';

export function mapMembershipPlanToOwner(
  plan: PlanRow,
  prices: PriceRow[],
  activeSubscriberCount = 0
): OwnerSubscriptionPlan {
  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    benefits: Array.isArray(plan.benefits) ? plan.benefits : [],
    visitDurationMinutes: planVisitDurationMinutes(plan),
    cadenceOptions: mapCadenceOptions(prices),
    createdAt: plan.created_at,
    isPublished: plan.is_published,
    activeSubscriberCount,
  };
}

export function mapMembershipPlanToCustomer(
  plan: PlanRow,
  prices: PriceRow[]
): CustomerSubscriptionPlan {
  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    benefits: Array.isArray(plan.benefits) ? plan.benefits : [],
    visitDurationMinutes: planVisitDurationMinutes(plan),
    cadenceOptions: mapCadenceOptions(prices),
    isPopular: plan.is_popular,
  };
}
