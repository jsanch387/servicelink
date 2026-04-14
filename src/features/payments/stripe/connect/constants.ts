/** ISO country for new Stripe Connect Express accounts (override with STRIPE_CONNECT_DEFAULT_COUNTRY). */
export function getDefaultConnectAccountCountry(): string {
  return (
    process.env.STRIPE_CONNECT_DEFAULT_COUNTRY?.trim().toUpperCase() || 'US'
  );
}
