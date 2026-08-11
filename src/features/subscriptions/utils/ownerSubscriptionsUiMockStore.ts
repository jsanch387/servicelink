import type { OwnerSubscriptionPlan } from '../types/ownerSubscriptionPlan';

const STORAGE_KEY = 'owner-subscriptions-ui-mock-v1';

export type OwnerSubscriptionsUiMockState = {
  enabled: boolean;
  plans: OwnerSubscriptionPlan[];
};

const DEFAULT_STATE: OwnerSubscriptionsUiMockState = {
  enabled: false,
  plans: [],
};

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof sessionStorage !== 'undefined';
}

function normalizePlan(plan: OwnerSubscriptionPlan): OwnerSubscriptionPlan {
  return {
    ...plan,
    benefits: Array.isArray(plan.benefits) ? plan.benefits : [],
    isPublished: plan.isPublished !== false,
    activeSubscriberCount:
      typeof plan.activeSubscriberCount === 'number'
        ? plan.activeSubscriberCount
        : 0,
  };
}

export function readOwnerSubscriptionsUiMock(): OwnerSubscriptionsUiMockState {
  if (!canUseStorage()) return { ...DEFAULT_STATE, plans: [] };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE, plans: [] };
    const parsed = JSON.parse(raw) as Partial<OwnerSubscriptionsUiMockState>;
    const plans = Array.isArray(parsed.plans)
      ? parsed.plans.map(plan => normalizePlan(plan as OwnerSubscriptionPlan))
      : [];
    return {
      enabled: parsed.enabled === true,
      plans,
    };
  } catch {
    return { ...DEFAULT_STATE, plans: [] };
  }
}

export function writeOwnerSubscriptionsUiMock(
  next: OwnerSubscriptionsUiMockState
): void {
  if (!canUseStorage()) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore quota / private mode
  }
}

export function enableOwnerSubscriptionsUiMock(): OwnerSubscriptionsUiMockState {
  const current = readOwnerSubscriptionsUiMock();
  const next = { ...current, enabled: true };
  writeOwnerSubscriptionsUiMock(next);
  return next;
}

export function addOwnerSubscriptionPlanUiMock(
  plan: OwnerSubscriptionPlan
): OwnerSubscriptionsUiMockState {
  const current = readOwnerSubscriptionsUiMock();
  const next = {
    enabled: true,
    plans: [...current.plans, normalizePlan(plan)],
  };
  writeOwnerSubscriptionsUiMock(next);
  return next;
}

export function setOwnerSubscriptionPlanPublishedUiMock(
  planId: string,
  isPublished: boolean
): OwnerSubscriptionsUiMockState {
  const current = readOwnerSubscriptionsUiMock();
  const next = {
    ...current,
    plans: current.plans.map(plan =>
      plan.id === planId ? { ...plan, isPublished } : plan
    ),
  };
  writeOwnerSubscriptionsUiMock(next);
  return next;
}

export function getOwnerSubscriptionPlanUiMock(
  planId: string
): OwnerSubscriptionPlan | null {
  return (
    readOwnerSubscriptionsUiMock().plans.find(plan => plan.id === planId) ??
    null
  );
}
