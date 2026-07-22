/**
 * Public marketplace / find-detailers discovery.
 *
 * OFF by default. Set `MARKETPLACE_PUBLIC_ENABLED=true` only when ready to
 * expose customer search. Address collection does not depend on this flag.
 */
export function isMarketplacePublicEnabled(): boolean {
  return (
    process.env.MARKETPLACE_PUBLIC_ENABLED?.trim().toLowerCase() === 'true'
  );
}
