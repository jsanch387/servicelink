import type { BillingInterval } from '../types';
import {
  PLANS,
  PRO_YEARLY_LIST_PRICE,
  PRO_YEARLY_SAVINGS_LABEL,
  TEAM_YEARLY_LIST_PRICE,
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

/** Team list price for the pricing screen. Same yearly offer as Pro. */
export function getTeamBillingDisplay(
  interval: BillingInterval
): ProBillingDisplay {
  if (interval === 'year') {
    return {
      price: TEAM_YEARLY_LIST_PRICE,
      priceSuffix: '/ year',
      savingsLabel: PRO_YEARLY_SAVINGS_LABEL,
      subline: '$50/mo billed annually',
    };
  }

  return {
    price: PLANS.team.price,
    priceSuffix: '/ month',
    savingsLabel: null,
    subline: null,
  };
}
