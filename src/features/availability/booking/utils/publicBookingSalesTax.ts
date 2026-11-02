import type { CheckoutPaymentMode } from '@/features/payments/types/checkoutPaymentMode';
import {
  formatSalesTaxRateLabel,
  salesTaxCents,
} from '@/features/payments/utils/salesTaxRate';

export type PublicBookingPaymentChoice = 'pay_now' | 'pay_in_person' | null;

export interface PublicBookingSalesTaxQuote {
  rateBps: number;
  taxCents: number;
  /** Price after discounts, before tax. */
  priceAfterDiscountCents: number;
  /** Price after discounts plus tax. */
  totalCents: number;
}

/**
 * Tax once on the price after discounts.
 * A disabled switch or a zero rate leaves the price unchanged.
 */
export function quotePublicBookingSalesTax(input: {
  priceAfterDiscountCents: number;
  taxEnabled: boolean;
  taxRateBps: number;
}): PublicBookingSalesTaxQuote {
  const priceAfterDiscountCents = Math.max(
    0,
    Math.round(input.priceAfterDiscountCents)
  );
  if (!input.taxEnabled) {
    return {
      rateBps: 0,
      taxCents: 0,
      priceAfterDiscountCents,
      totalCents: priceAfterDiscountCents,
    };
  }
  const rateBps = Math.round(input.taxRateBps);
  const taxCents = salesTaxCents(priceAfterDiscountCents, rateBps);
  return {
    rateBps: taxCents > 0 ? rateBps : 0,
    taxCents,
    priceAfterDiscountCents,
    totalCents: priceAfterDiscountCents + taxCents,
  };
}

export function salesTaxEmailLine(
  rateBps: number,
  taxCents: number
): { label: string; taxCents: number } | null {
  if (taxCents <= 0) return null;
  const rate = formatSalesTaxRateLabel(rateBps);
  return {
    label: rate ? `Tax (${rate})` : 'Tax',
    taxCents,
  };
}

/** Deposit slice of a total. Deposits off means the whole total is due. */
export function depositDueNowCents(input: {
  depositsEnabled: boolean;
  depositType: 'fixed' | 'percent';
  depositValue: number;
  totalCents: number;
}): number {
  const total = Math.max(0, Math.round(input.totalCents));
  if (!input.depositsEnabled) return total;
  if (input.depositType === 'fixed') {
    return Math.min(total, Math.max(0, Math.round(input.depositValue)));
  }
  const percent = Math.min(100, Math.max(0, Math.round(input.depositValue)));
  return Math.round((total * percent) / 100);
}

/**
 * Card amount due now. Pay-in-full wins over a deposit.
 * Pass the taxed job total when sales tax applies.
 */
export function onlineAmountDueNowCents(input: {
  paymentsEnabled: boolean;
  checkoutMode: CheckoutPaymentMode | null;
  depositsEnabled: boolean;
  depositType: 'fixed' | 'percent';
  depositValue: number;
  customerPaymentChoice: PublicBookingPaymentChoice;
  totalCents: number;
}): number {
  if (!input.paymentsEnabled) return 0;
  const total = Math.max(0, Math.round(input.totalCents));
  const deposit = depositDueNowCents({
    depositsEnabled: input.depositsEnabled,
    depositType: input.depositType,
    depositValue: input.depositValue,
    totalCents: total,
  });
  const requiresDepositNow = input.depositsEnabled && deposit > 0;
  const requiresPayNow =
    input.checkoutMode === 'in_app' ||
    (input.checkoutMode === 'customer_choice' &&
      input.customerPaymentChoice === 'pay_now');
  if (requiresPayNow) return total;
  if (requiresDepositNow) return deposit;
  return 0;
}
