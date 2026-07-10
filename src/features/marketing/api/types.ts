import type { PromoCode, Sale } from '../types';

export type PromoCodesListResponse =
  | { success: true; promoCodes: PromoCode[] }
  | { success: false; error: string };

export type PromoCodeCreateResponse =
  | { success: true; promoCode: PromoCode }
  | { success: false; error: string };

export type PromoCodeUpdateResponse =
  | { success: true; promoCode: PromoCode }
  | { success: false; error: string };

export type SalesListResponse =
  | { success: true; sales: Sale[] }
  | { success: false; error: string };

export type SaleCreateResponse =
  | { success: true; sale: Sale }
  | { success: false; error: string };

export type SaleUpdateResponse =
  | { success: true; sale: Sale }
  | { success: false; error: string };

export type PromoCodeDetailResponse =
  | { success: true; promoCode: PromoCode }
  | { success: false; error: string };

export type SaleDetailResponse =
  | { success: true; sale: Sale }
  | { success: false; error: string };

export type MarketingDeleteResponse =
  | { success: true }
  | { success: false; error: string };

export interface CreatePromoCodePayload {
  code: string;
  description?: string | null;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  isActive: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  oneUsePerCustomer: boolean;
}

export interface CreateSalePayload {
  name: string;
  description?: string | null;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  isActive: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}

export interface ToggleActivePayload {
  isActive: boolean;
}
