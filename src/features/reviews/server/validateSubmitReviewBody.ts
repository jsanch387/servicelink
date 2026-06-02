const RATING_MIN = 1;
const RATING_MAX = 5;
const BODY_MAX = 2000;
/** DB requires trimmed body length >= 1 when comment omitted. */
const BODY_EMPTY_PLACEHOLDER = '—';

export type SubmitReviewBody = {
  token: string;
  rating: number;
  body: string;
};

type ValidateResult =
  | { ok: true; value: SubmitReviewBody }
  | { ok: false; error: string };

export function normalizeReviewBodyForDb(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return BODY_EMPTY_PLACEHOLDER;
  return trimmed.length > BODY_MAX ? trimmed.slice(0, BODY_MAX) : trimmed;
}

export function validateSubmitReviewBody(input: unknown): ValidateResult {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Invalid request body' };
  }

  const { token, rating, body } = input as {
    token?: unknown;
    rating?: unknown;
    body?: unknown;
  };

  if (typeof token !== 'string' || !token.trim()) {
    return { ok: false, error: 'token is required' };
  }

  const ratingNum =
    typeof rating === 'number'
      ? rating
      : typeof rating === 'string'
        ? Number(rating)
        : NaN;

  if (
    !Number.isInteger(ratingNum) ||
    ratingNum < RATING_MIN ||
    ratingNum > RATING_MAX
  ) {
    return { ok: false, error: 'rating must be an integer from 1 to 5' };
  }

  const bodyStr = typeof body === 'string' ? body : '';
  const normalizedBody = normalizeReviewBodyForDb(bodyStr);

  return {
    ok: true,
    value: {
      token: token.trim(),
      rating: ratingNum,
      body: normalizedBody,
    },
  };
}
