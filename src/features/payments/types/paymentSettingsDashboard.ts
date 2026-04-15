import type { CheckoutPaymentMode } from './checkoutPaymentMode';

/** Serializable snapshot from `payment_settings` for the Pro payments dashboard. */
export interface PaymentSettingsDashboardInitial {
  checkoutMode: CheckoutPaymentMode | null;
  depositsEnabled: boolean;
  depositType: 'fixed' | 'percent';
  /** Cents when `depositType === 'fixed'`, whole percent 0–100 when `percent`. */
  depositValue: number;
  currency: string;
}
