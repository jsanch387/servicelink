const REPLY_MIN_LENGTH = 1;
const REPLY_MAX_LENGTH = 1000;

export type UpdateReviewBody = {
  ownerReplyBody: string | null;
};

type ValidateResult =
  | { ok: true; value: UpdateReviewBody }
  | { ok: false; error: string };

export function validateUpdateReviewBody(input: unknown): ValidateResult {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Invalid request body' };
  }

  if (!('ownerReplyBody' in input)) {
    return { ok: false, error: 'ownerReplyBody is required' };
  }

  const { ownerReplyBody } = input as { ownerReplyBody?: unknown };

  if (ownerReplyBody === null) {
    return { ok: true, value: { ownerReplyBody: null } };
  }

  if (typeof ownerReplyBody !== 'string') {
    return { ok: false, error: 'ownerReplyBody must be a string or null' };
  }

  const trimmed = ownerReplyBody.trim();
  if (trimmed.length < REPLY_MIN_LENGTH) {
    return { ok: false, error: 'Reply cannot be empty' };
  }
  if (trimmed.length > REPLY_MAX_LENGTH) {
    return {
      ok: false,
      error: `Reply must be at most ${REPLY_MAX_LENGTH} characters`,
    };
  }

  return { ok: true, value: { ownerReplyBody: trimmed } };
}
