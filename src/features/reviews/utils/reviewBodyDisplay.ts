/** Stored when a customer leaves stars with no written comment. */
export const REVIEW_BODY_EMPTY_PLACEHOLDER = '—';

export function isVisibleReviewBody(
  body: string | null | undefined
): boolean {
  const trimmed = body?.trim() ?? '';
  return trimmed.length > 0 && trimmed !== REVIEW_BODY_EMPTY_PLACEHOLDER;
}
