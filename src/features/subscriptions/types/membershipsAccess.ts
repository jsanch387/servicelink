/** Server-resolved readiness for turning on customer memberships. */
export type MembershipsAccessGate =
  | 'not_in_rollout'
  | 'not_pro'
  | 'needs_connect'
  | 'needs_payments'
  | 'ready';

export type MembershipsAccess = {
  gate: MembershipsAccessGate;
  /** Owner email is on the temporary memberships allowlist (or open-to-all). */
  inRollout: boolean;
  hasProAccess: boolean;
  stripeConnectReady: boolean;
  /** Saved Connect account but onboarding incomplete. */
  stripeConnectResume: boolean;
  stripeConnectRestricted: boolean;
  /** ServiceLink checkout on (`payment_settings.payments_enabled`). */
  paymentsEnabled: boolean;
};

export function resolveMembershipsAccessGate(input: {
  inRollout: boolean;
  hasProAccess: boolean;
  stripeConnectReady: boolean;
  paymentsEnabled: boolean;
}): MembershipsAccessGate {
  if (!input.inRollout) return 'not_in_rollout';
  if (!input.hasProAccess) return 'not_pro';
  if (!input.stripeConnectReady) return 'needs_connect';
  if (!input.paymentsEnabled) return 'needs_payments';
  return 'ready';
}
