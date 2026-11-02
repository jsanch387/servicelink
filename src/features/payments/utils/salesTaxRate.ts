/**
 * Highest rate the settings field will accept.
 * US combined sales tax stays well under this. The cap blocks a doubled price.
 */
export const MAX_SALES_TAX_PERCENT = 25;

/**
 * Digits and one decimal only, at most two places, never above the cap.
 * A trailing dot is kept so the field can still be typed.
 */
export function sanitizeSalesTaxPercent(raw: string): string {
  const s = raw.replace(/[^0-9.]/g, '');
  if (s === '') return '';

  const firstDot = s.indexOf('.');
  if (firstDot === -1) {
    const n = parseInt(s, 10);
    if (!Number.isFinite(n)) return '';
    if (n > MAX_SALES_TAX_PERCENT) return String(MAX_SALES_TAX_PERCENT);
    return String(n);
  }

  let intPart = s.slice(0, firstDot).replace(/\./g, '');
  const decPart = s
    .slice(firstDot + 1)
    .replace(/\./g, '')
    .slice(0, 2);
  if (intPart === '') intPart = '0';

  const intNum = parseInt(intPart, 10);
  const safeInt = Number.isFinite(intNum) ? intNum : 0;
  if (safeInt >= MAX_SALES_TAX_PERCENT) return String(MAX_SALES_TAX_PERCENT);

  if (s.endsWith('.') && decPart.length === 0) {
    return `${safeInt}.`;
  }
  return decPart.length > 0 ? `${safeInt}.${decPart}` : String(safeInt);
}

/**
 * A chargeable rate: greater than 0 and at most the cap.
 * Blank, zero, and a lone dot are not a rate.
 */
export function parseSalesTaxPercent(raw: string): number | null {
  const cleaned = sanitizeSalesTaxPercent(raw);
  if (cleaned === '' || cleaned === '.') return null;

  const numeric = cleaned.endsWith('.') ? cleaned.slice(0, -1) : cleaned;
  const n = Number(numeric);
  if (!Number.isFinite(n) || n <= 0 || n > MAX_SALES_TAX_PERCENT) return null;

  return Math.round(n * 100) / 100;
}

/** `8.25` → `825`. Hundredths of a percent, matching `payment_settings.tax_rate_bps`. */
export function salesTaxPercentToBps(percent: number): number {
  if (!Number.isFinite(percent) || percent <= 0) return 0;
  return Math.min(MAX_SALES_TAX_PERCENT * 100, Math.round(percent * 100));
}

/** `825` → `"8.25"`. Zero or a missing rate is an empty field. */
export function salesTaxBpsToInput(bps: number): string {
  if (!Number.isFinite(bps) || bps <= 0) return '';
  const clamped = Math.min(MAX_SALES_TAX_PERCENT * 100, Math.round(bps));
  return String(clamped / 100);
}

/** `825` → `"8.25%"`. Empty when there is no rate. */
export function formatSalesTaxRateLabel(rateBps: number): string {
  const input = salesTaxBpsToInput(rateBps);
  return input ? `${input}%` : '';
}

/**
 * Tax on a price that is already after discounts.
 * `15000` cents at `825` bps (8.25%) is `1238` cents ($12.38).
 */
export function salesTaxCents(taxableCents: number, rateBps: number): number {
  const base = Math.max(0, Math.round(taxableCents));
  const bps = Math.round(rateBps);
  if (
    base <= 0 ||
    !Number.isFinite(bps) ||
    bps < 1 ||
    bps > MAX_SALES_TAX_PERCENT * 100
  ) {
    return 0;
  }
  return Math.round((base * bps) / 10_000);
}
