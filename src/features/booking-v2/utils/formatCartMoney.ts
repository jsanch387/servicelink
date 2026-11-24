/** Cart prices always show cents, matching the review layout. */
export function formatCartDollars(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  return `${sign}$${(Math.abs(cents) / 100).toFixed(2)}`;
}
