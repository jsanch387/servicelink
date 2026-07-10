export type DiscountType = 'percentage' | 'fixed_amount';

export type PromoCodeStatus = 'active' | 'scheduled' | 'expired' | 'inactive';
export type SaleStatus = 'active' | 'scheduled' | 'expired' | 'inactive';

export interface PromoCode {
  id: string;
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  isActive: boolean;
  startsAt?: Date | null;
  endsAt?: Date | null;
  maxUses?: number | null;
  currentUseCount: number;
  oneUsePerCustomer: boolean;
  createdAt: Date;
}

export interface Sale {
  id: string;
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  isActive: boolean;
  startsAt?: Date | null;
  endsAt?: Date | null;
  appliesToAllServices: boolean;
  serviceIds?: string[];
  createdAt: Date;
}

export interface PromoCodeFormData {
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: string;
  isActive: boolean;
  hasDateRange: boolean;
  startsAt: string;
  endsAt: string;
  hasMaxUses: boolean;
  maxUses: string;
  oneUsePerCustomer: boolean;
}

export interface SaleFormData {
  name: string;
  description: string;
  discountType: DiscountType;
  discountValue: string;
  isActive: boolean;
  hasDateRange: boolean;
  startsAt: string;
  endsAt: string;
  appliesToAllServices: boolean;
  serviceIds: string[];
}
