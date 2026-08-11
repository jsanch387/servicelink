import type {
  OwnerSubscriber,
  OwnerSubscriberStatus,
} from '../types/ownerSubscriptionPlan';

const STORAGE_KEY = 'owner-subscribers-ui-mock-v1';

type SubscriberOverride = Partial<
  Pick<OwnerSubscriber, 'status' | 'cancelAtPeriodEnd' | 'nextBillingAt'>
>;

type StoreShape = Record<string, SubscriberOverride>;

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof sessionStorage !== 'undefined';
}

function readOverrides(): StoreShape {
  if (!canUseStorage()) return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as StoreShape;
  } catch {
    return {};
  }
}

function writeOverrides(next: StoreShape): void {
  if (!canUseStorage()) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function applySubscriberOverrides(
  subscribers: OwnerSubscriber[]
): OwnerSubscriber[] {
  const overrides = readOverrides();
  return subscribers.map(subscriber => {
    const patch = overrides[subscriber.id];
    return patch ? { ...subscriber, ...patch } : subscriber;
  });
}

export function cancelSubscriberAtPeriodEndUiMock(subscriberId: string): void {
  const overrides = readOverrides();
  overrides[subscriberId] = {
    ...overrides[subscriberId],
    cancelAtPeriodEnd: true,
    status: 'active',
  };
  writeOverrides(overrides);
}

export function cancelSubscriberImmediatelyUiMock(subscriberId: string): void {
  const overrides = readOverrides();
  overrides[subscriberId] = {
    ...overrides[subscriberId],
    status: 'canceled' satisfies OwnerSubscriberStatus,
    cancelAtPeriodEnd: false,
    nextBillingAt: null,
  };
  writeOverrides(overrides);
}
