const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const usdDollars = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatPaymentCents(cents: number): string {
  return usd.format(cents / 100);
}

/** Mobile revenue headline: whole dollars, no cents. */
export function formatPaymentDollars(cents: number): string {
  return usdDollars.format(Math.round(cents / 100));
}
