export function isStripeConnectReady(
  account:
    | {
        onboarding_status?: string | null;
        charges_enabled?: boolean | null;
      }
    | null
    | undefined
): boolean {
  return (
    account?.onboarding_status === 'complete' &&
    account?.charges_enabled === true
  );
}
