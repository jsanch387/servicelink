/** Whole dollars stay whole. Cents show only when the amount has them. */
export function formatSetupDollars(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const dollars = Math.abs(cents) / 100;
  const body = Number.isInteger(dollars)
    ? dollars.toFixed(0)
    : dollars.toFixed(2);
  return `${sign}$${body}`;
}

export function formatSetupAddonPrice(cents: number): string {
  return `+${formatSetupDollars(cents)}`;
}
