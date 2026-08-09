import { MOCK_OWNER_SUBSCRIBERS } from '../constants/mockOwnerSubscribers';
import type {
  OwnerSubscriber,
  OwnerSubscriberStatus,
  OwnerSubscriptionPlan,
} from '../types/ownerSubscriptionPlan';

export const OWNER_SUBSCRIBER_STATUS_STYLES: Record<
  OwnerSubscriberStatus,
  { label: string; className: string }
> = {
  active: {
    label: 'Active',
    className: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300',
  },
  past_due: {
    label: 'Past due',
    className: 'border-amber-400/20 bg-amber-500/10 text-amber-300',
  },
  canceled: {
    label: 'Canceled',
    className: 'border-white/10 bg-white/[0.04] text-zinc-500',
  },
};

export function formatSubscriberBillingDate(date: string | null): string {
  if (!date) return '—';
  try {
    return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return date;
  }
}

/** Attach mock subscribers to the owner's real plan ids when names match. */
export function bindSubscribersToPlans(
  plans: OwnerSubscriptionPlan[]
): OwnerSubscriber[] {
  if (plans.length === 0) return [];

  return MOCK_OWNER_SUBSCRIBERS.map((subscriber, index) => {
    const byName = plans.find(
      plan => plan.name.toLowerCase() === subscriber.planName.toLowerCase()
    );
    const plan = byName ?? plans[index % plans.length];
    return {
      ...subscriber,
      planId: plan.id,
      planName: plan.name,
    };
  });
}

export function findBoundSubscriber(
  subscriberId: string,
  plans: OwnerSubscriptionPlan[]
): OwnerSubscriber | null {
  return (
    bindSubscribersToPlans(plans).find(item => item.id === subscriberId) ?? null
  );
}
