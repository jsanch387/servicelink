import type { BillingInterval } from '../types';
import {
  PLANS,
  PRO_YEARLY_LIST_PRICE,
  PRO_YEARLY_SAVINGS_LABEL,
} from '../types';

export interface ProBillingDisplay {
  price: string;
  priceSuffix: string;
  savingsLabel: string | null;
  /** Optional subline under price (e.g. effective monthly on yearly). */
  subline: string | null;
}

export function getProBillingDisplay(
  interval: BillingInterval
): ProBillingDisplay {
  if (interval === 'year') {
    return {
      price: PRO_YEARLY_LIST_PRICE,
      priceSuffix: '/ year',
      savingsLabel: PRO_YEARLY_SAVINGS_LABEL,
      subline: '$16.67/mo billed annually',
    };
  }

  return {
    price: PLANS.pro.price,
    priceSuffix: '/ month',
    savingsLabel: null,
    subline: null,
  };
}
