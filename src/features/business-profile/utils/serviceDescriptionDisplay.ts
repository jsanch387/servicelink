/**
 * Public service cards: preserve newlines from the description textarea (`\n` → line breaks).
 */

/** Max characters for service description (multi-line lists). */
export const SERVICE_DESCRIPTION_MAX_LENGTH = 800;

/** Max lines shown before "See more" on service cards. */
export const SERVICE_CARD_DESCRIPTION_LINE_CLAMP = 5;

/**
 * Collapsed description cap for service cards (5 × leading-relaxed lines).
 * Uses max-height instead of line-clamp so bullet rows from
 * ServiceDescriptionFormatted still truncate and measure correctly.
 */
export const SERVICE_CARD_DESCRIPTION_CLAMP_CLASS =
  'max-h-[7.625rem] overflow-hidden sm:max-h-[7.125rem]';

const BULLET_PREFIX = '• ';

export type ServiceDescriptionLine =
  | { kind: 'empty' }
  | { kind: 'bullet'; text: string }
  | { kind: 'text'; text: string };

/** Split a stored description into renderable lines (bullets vs plain text). */
export function parseServiceDescriptionLine(
  line: string
): ServiceDescriptionLine {
  if (line === '') return { kind: 'empty' };
  if (line.startsWith(BULLET_PREFIX)) {
    return { kind: 'bullet', text: line.slice(BULLET_PREFIX.length) };
  }
  if (line.startsWith('•')) {
    return { kind: 'bullet', text: line.slice(1).trimStart() };
  }
  return { kind: 'text', text: line };
}

export function parseServiceDescriptionLines(
  description: string
): ServiceDescriptionLine[] {
  return description.split(/\r?\n/).map(parseServiceDescriptionLine);
}

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
