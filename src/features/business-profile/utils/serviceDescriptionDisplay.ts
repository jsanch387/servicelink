/**
 * Public service cards: preserve newlines from the description textarea (`\n` → line breaks).
 */

/** Max characters for service description (multi-line lists). */
export const SERVICE_DESCRIPTION_MAX_LENGTH = 800;

/** Max lines shown before "See more" (matches Tailwind `line-clamp-5`). */
export const SERVICE_CARD_DESCRIPTION_LINE_CLAMP = 5;

/** True when collapsed preview should offer expand (by length or line count). */
export function serviceDescriptionNeedsSeeMore(description: string): boolean {
  const d = description ?? '';
  const lineCount = d.split(/\r?\n/).length;
  return d.length > 220 || lineCount > SERVICE_CARD_DESCRIPTION_LINE_CLAMP;
}

const BULLET_PREFIX = '• ';

/**
 * Inserts a bullet (`• `) at the caret. Adds a leading newline when not already at a line start.
 */
export function insertServiceDescriptionBullet(
  value: string,
  caretStart: number,
  caretEnd: number
): { value: string; caret: number } {
  const before = value.slice(0, caretStart);
  const after = value.slice(caretEnd);
  const needsNewline = before.length > 0 && !before.endsWith('\n');
  const insertion = needsNewline ? `\n${BULLET_PREFIX}` : BULLET_PREFIX;
  const next = before + insertion + after;
  return { value: next, caret: caretStart + insertion.length };
}
