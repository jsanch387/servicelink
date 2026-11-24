import type { CheckoutPaymentMode } from '../types/checkoutPaymentMode';
import type { PaymentSettingsDashboardInitial } from '../types/paymentSettingsDashboard';

const CHECKOUT_MODES: readonly CheckoutPaymentMode[] = [
  'in_person',
  'in_app',
  'customer_choice',
] as const;

export function checkoutModeFromDb(
  raw: string | null | undefined
): CheckoutPaymentMode | null {
  if (!raw) return null;
  return CHECKOUT_MODES.includes(raw as CheckoutPaymentMode)
    ? (raw as CheckoutPaymentMode)
    : null;
}

export function paymentSettingsRowToDashboardInitial(row: {
  checkout_mode: string | null;
  deposits_enabled: boolean;
  deposit_type: string;
  deposit_value: number;
  currency: string;
  tax_enabled?: boolean | null;
  tax_rate_bps?: number | null;
}): PaymentSettingsDashboardInitial {
  const depositType =
    row.deposit_type === 'fixed' || row.deposit_type === 'percent'
      ? row.deposit_type
      : 'percent';

  return {
    checkoutMode: checkoutModeFromDb(row.checkout_mode),
    depositsEnabled: row.deposits_enabled,
    depositType,
    depositValue: Number.isFinite(row.deposit_value) ? row.deposit_value : 0,
    currency: row.currency?.trim() || 'usd',
    taxEnabled: row.tax_enabled === true,
    taxRateBps:
      typeof row.tax_rate_bps === 'number' && Number.isFinite(row.tax_rate_bps)
        ? Math.max(0, Math.round(row.tax_rate_bps))
        : 0,
  };
}

export function centsToMoneyInputString(cents: number): string {
  if (!Number.isFinite(cents) || cents < 0) return '0';
  if (cents === 0) return '0';
  const dollars = cents / 100;
  return Number.isInteger(dollars) ? String(dollars) : dollars.toFixed(2);
}

export function dollarsStringToCents(raw: string): number {
  const n = parseFloat(raw.replace(/,/g, ''));
  if (Number.isNaN(n) || n < 0) return 0;
  return Math.round(n * 100);
}
