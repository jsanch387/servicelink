import type { CreatePromoCodePayload } from '../api/types';

type ValidationResult =
  | { ok: true; value: CreatePromoCodePayload }
  | { ok: false; error: string };

function isDiscountType(
  value: unknown
): value is 'percentage' | 'fixed_amount' {
  return value === 'percentage' || value === 'fixed_amount';
}

export function validateCreatePromoCodeBody(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Invalid request body' };
  }

  const raw = body as Record<string, unknown>;
  const code =
    typeof raw.code === 'string' ? raw.code.trim().toUpperCase() : '';

  if (!code) {
    return { ok: false, error: 'Code is required' };
  }
  if (!/^[A-Z0-9]+$/.test(code)) {
    return { ok: false, error: 'Use uppercase letters and numbers only' };
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

  if (typeof raw.oneUsePerCustomer !== 'boolean') {
    return { ok: false, error: 'oneUsePerCustomer must be a boolean' };
  }

  const description =
    typeof raw.description === 'string' && raw.description.trim()
      ? raw.description.trim()
      : null;

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

  return {
    ok: true,
    value: {
      code,
      description,
      discountType: raw.discountType,
      discountValue,
      isActive: raw.isActive,
      startsAt,
      endsAt,
      oneUsePerCustomer: raw.oneUsePerCustomer,
    },
  };
}

export function validateToggleActiveBody(
  body: unknown
): { ok: true; value: { isActive: boolean } } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Invalid request body' };
  }

  const raw = body as Record<string, unknown>;
  if (typeof raw.isActive !== 'boolean') {
    return { ok: false, error: 'isActive must be a boolean' };
  }

  return { ok: true, value: { isActive: raw.isActive } };
}
