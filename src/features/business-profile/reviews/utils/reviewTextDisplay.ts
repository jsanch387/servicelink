export const REVIEW_BODY_COLLAPSED_MAX_MOBILE = 180;
export const REVIEW_BODY_COLLAPSED_MAX_DESKTOP = 360;

export const REVIEW_REPLY_COLLAPSED_MAX_MOBILE = 120;
export const REVIEW_REPLY_COLLAPSED_MAX_DESKTOP = 240;

export type ReviewExpandableTextVariant = 'reviewBody' | 'ownerReply';

export function reviewCollapsedMaxChars(
  variant: ReviewExpandableTextVariant,
  isDesktop: boolean
): number {
  if (variant === 'ownerReply') {
    return isDesktop
      ? REVIEW_REPLY_COLLAPSED_MAX_DESKTOP
      : REVIEW_REPLY_COLLAPSED_MAX_MOBILE;
  }
  return isDesktop
    ? REVIEW_BODY_COLLAPSED_MAX_DESKTOP
    : REVIEW_BODY_COLLAPSED_MAX_MOBILE;
}

export function reviewTextNeedsExpand(text: string, maxChars: number): boolean {
  return text.trim().length > maxChars;
}

/** Truncate at a word boundary when possible. */
export function truncateReviewText(text: string, maxChars: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return trimmed;

  const slice = trimmed.slice(0, maxChars);
  const lastSpace = slice.lastIndexOf(' ');
  const cut =
    lastSpace > Math.floor(maxChars * 0.55)
      ? slice.slice(0, lastSpace)
      : slice.trimEnd();

  return `${cut.trimEnd()}…`;
}
