export function googleReviewsParentName(
  accountName: string,
  locationName: string
): string | null {
  const account = accountName.trim();
  const location = locationName.trim();
  if (!account || !location) return null;
  if (location.startsWith('accounts/') && location.includes('/locations/')) {
    return location;
  }
  const accountPath = account.startsWith('accounts/')
    ? account
    : `accounts/${account}`;
  const locationPath = location.startsWith('locations/')
    ? location
    : `locations/${location}`;
  return `${accountPath}/${locationPath}`;
}
