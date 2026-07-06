const PLACEHOLDER_BUSINESS_NAME = 'your provider';

export function invoiceSnapshotNeedsBusinessHydration(snapshot: {
  business: { name?: string; profileUrl?: string | null };
}): boolean {
  const name = snapshot.business.name?.trim().toLowerCase() || '';
  const isPlaceholder = !name || name === PLACEHOLDER_BUSINESS_NAME;
  return isPlaceholder || !snapshot.business.profileUrl?.trim();
}
