import type { PromoCode } from '../types';
import { parseDbTimestamp } from './dateUtils';
import type { PromoCodeRow } from './rows';

function parseDiscountValue(value: number | string): number | null {
  const parsed = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function mapPromoCodeRowToPromoCode(
  row: PromoCodeRow,
  redemptionCount = 0
): PromoCode {
  const discountValue = parseDiscountValue(row.discount_value);
  if (discountValue === null) {
    throw new Error(`Invalid discount_value for promo code ${row.id}`);
  }

  return {
    id: row.id,
    code: row.code,
    description: row.description?.trim() || undefined,
    discountType: row.discount_type as PromoCode['discountType'],
    discountValue,
    isActive: row.is_active,
    startsAt: parseDbTimestamp(row.starts_at),
    endsAt: parseDbTimestamp(row.ends_at),
    maxUses: null,
    currentUseCount: redemptionCount,
    oneUsePerCustomer: row.one_use_per_customer,
    createdAt: new Date(row.created_at),
  };
}

export function tryMapPromoCodeRowToPromoCode(
  row: Partial<PromoCodeRow> | null | undefined,
  redemptionCount = 0
): PromoCode | null {
  if (!row?.id?.trim() || !row.code?.trim()) return null;
  if (
    row.discount_type !== 'percentage' &&
    row.discount_type !== 'fixed_amount'
  ) {
    return null;
  }
  if (typeof row.is_active !== 'boolean') return null;
  if (typeof row.one_use_per_customer !== 'boolean') return null;
  if (!row.created_at?.trim()) return null;

  try {
    return mapPromoCodeRowToPromoCode(row as PromoCodeRow, redemptionCount);
  } catch {
    return null;
  }
}
