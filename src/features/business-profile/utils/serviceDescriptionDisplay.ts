/**
 * Public service cards: preserve newlines from the description textarea (`\n` → line breaks).
 */

/** Max characters for service description (multi-line lists). */
export const SERVICE_DESCRIPTION_MAX_LENGTH = 800;

/** Max lines shown before "See more" on service cards. */
export const SERVICE_CARD_DESCRIPTION_LINE_CLAMP = 5;

export const SERVICE_CARD_DESCRIPTION_COLLAPSED_MAX_MOBILE = 140;
export const SERVICE_CARD_DESCRIPTION_COLLAPSED_MAX_DESKTOP = 220;

/**
 * Collapsed description cap for service cards (5 × leading-relaxed lines).
 * Uses max-height instead of line-clamp so bullet rows from
 * ServiceDescriptionFormatted still truncate and measure correctly.
 */
export const SERVICE_CARD_DESCRIPTION_CLAMP_CLASS =
  'max-h-[7.625rem] overflow-hidden sm:max-h-[7.125rem]';

/** Flatten multiline / bullet descriptions for inline card previews. */
export function flattenServiceDescriptionForCardPreview(
  description: string
): string {
  return description
    .split(/\r?\n/)
    .map(line => line.replace(/^•\s?/, '').trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function serviceCardDescriptionCollapsedMaxChars(
  isDesktop: boolean
): number {
  return isDesktop
    ? SERVICE_CARD_DESCRIPTION_COLLAPSED_MAX_DESKTOP
    : SERVICE_CARD_DESCRIPTION_COLLAPSED_MAX_MOBILE;
}

export function serviceCardDescriptionNeedsExpand(
  description: string,
  maxChars: number
): boolean {
  return flattenServiceDescriptionForCardPreview(description).length > maxChars;
}

/** Truncate at a word boundary when possible (no trailing ellipsis). */
export function truncateServiceDescriptionForCardPreview(
  description: string,
  maxChars: number
): string {
  const flattened = flattenServiceDescriptionForCardPreview(description);
  if (flattened.length <= maxChars) return flattened;

  const slice = flattened.slice(0, maxChars);
  const lastSpace = slice.lastIndexOf(' ');
  const cut =
    lastSpace > Math.floor(maxChars * 0.55)
      ? slice.slice(0, lastSpace)
      : slice.trimEnd();

  return cut.trimEnd();
}

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
