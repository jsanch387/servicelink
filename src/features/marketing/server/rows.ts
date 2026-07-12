export type PromoCodeRow = {
  id: string;
  business_id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number | string;
  starts_at: string | null;
  ends_at: string | null;
  one_use_per_customer: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type SaleRow = {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  discount_type: string;
  discount_value: number | string;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PromoCodeRedemptionCountRow = {
  promo_code_id: string;
};
