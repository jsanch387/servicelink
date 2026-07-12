import type { Sale } from '../types';
import { parseDbTimestamp } from './dateUtils';
import type { SaleRow } from './rows';

function parseDiscountValue(value: number | string): number | null {
  const parsed = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function mapSaleRowToSale(row: SaleRow): Sale {
  const discountValue = parseDiscountValue(row.discount_value);
  const startsAt = parseDbTimestamp(row.starts_at);
  const endsAt = parseDbTimestamp(row.ends_at);

  if (discountValue === null) {
    throw new Error(`Invalid sale row ${row.id}`);
  }

  if ((startsAt && !endsAt) || (!startsAt && endsAt)) {
    throw new Error(`Invalid sale date range for ${row.id}`);
  }

  return {
    id: row.id,
    name: row.name,
    description: row.description?.trim() || undefined,
    discountType: row.discount_type as Sale['discountType'],
    discountValue,
    isActive: row.is_active,
    startsAt,
    endsAt,
    appliesToAllServices: true,
    serviceIds: undefined,
    createdAt: new Date(row.created_at),
  };
}

export function tryMapSaleRowToSale(
  row: Partial<SaleRow> | null | undefined
): Sale | null {
  if (!row?.id?.trim() || !row.name?.trim()) return null;
  if (
    row.discount_type !== 'percentage' &&
    row.discount_type !== 'fixed_amount'
  ) {
    return null;
  }
  if (typeof row.is_active !== 'boolean') return null;
  if (!row.created_at?.trim()) return null;

  const hasStart = Boolean(row.starts_at?.trim());
  const hasEnd = Boolean(row.ends_at?.trim());
  if (hasStart !== hasEnd) return null;

  try {
    return mapSaleRowToSale(row as SaleRow);
  } catch {
    return null;
  }
}
