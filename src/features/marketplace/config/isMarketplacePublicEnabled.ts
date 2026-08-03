/**
 * Public marketplace / find-detailers discovery.
 *
 * Launched — kept as one switch so discovery can be pulled back in a single
 * edit instead of touching every route that gates on it. Owner address /
 * service-area collection does not depend on this.
 */
const MARKETPLACE_PUBLIC_ENABLED = true;

export function isMarketplacePublicEnabled(): boolean {
  return MARKETPLACE_PUBLIC_ENABLED;
}
