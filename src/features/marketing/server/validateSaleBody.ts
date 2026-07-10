import type { CreateSalePayload } from '../api/types';
import { SALE_NAME_MAX_LENGTH } from '../constants/limits';

type ValidationResult =
  | { ok: true; value: CreateSalePayload }
  | { ok: false; error: string };

function isDiscountType(
  value: unknown
): value is 'percentage' | 'fixed_amount' {
  return value === 'percentage' || value === 'fixed_amount';
}

export function validateCreateSaleBody(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Invalid request body' };
  }

  const raw = body as Record<string, unknown>;
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';

  if (!name) {
    return { ok: false, error: 'Sale name is required' };
  }
  if (name.length > SALE_NAME_MAX_LENGTH) {
    return {
      ok: false,
      error: `Sale name cannot exceed ${SALE_NAME_MAX_LENGTH} characters`,
    };
  }

  if (!isDiscountType(raw.discountType)) {
    return { ok: false, error: 'Invalid discount type' };
  }

  const discountValue =
    typeof raw.discountValue === 'number'
      ? raw.discountValue
      : parseFloat(String(raw.discountValue ?? ''));

  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    return { ok: false, error: 'Discount must be greater than 0' };
  }
  if (raw.discountType === 'percentage' && discountValue > 100) {
    return { ok: false, error: 'Percentage cannot exceed 100' };
  }

  if (typeof raw.isActive !== 'boolean') {
    return { ok: false, error: 'isActive must be a boolean' };
  }

  let startsAt: string | null = null;
  let endsAt: string | null = null;

  if (raw.startsAt != null && raw.startsAt !== '') {
    if (typeof raw.startsAt !== 'string') {
      return { ok: false, error: 'Invalid start date' };
    }
    startsAt = raw.startsAt.trim();
  }

  if (raw.endsAt != null && raw.endsAt !== '') {
    if (typeof raw.endsAt !== 'string') {
      return { ok: false, error: 'Invalid end date' };
    }
    endsAt = raw.endsAt.trim();
  }

  if ((startsAt && !endsAt) || (!startsAt && endsAt)) {
    return { ok: false, error: 'Both start and end dates are required' };
  }

  if (startsAt && endsAt && new Date(startsAt) >= new Date(endsAt)) {
    return { ok: false, error: 'End date must be after start date' };
  }

  const description =
    typeof raw.description === 'string' && raw.description.trim()
      ? raw.description.trim()
      : null;

  return {
    ok: true,
    value: {
      name,
      description,
      discountType: raw.discountType,
      discountValue,
      isActive: raw.isActive,
      startsAt,
      endsAt,
    },
  };
}

export { validateToggleActiveBody } from './validatePromoCodeBody';
