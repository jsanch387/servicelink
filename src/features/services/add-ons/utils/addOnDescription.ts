import { ADD_ON_DESCRIPTION_MAX_LENGTH } from '../../components/add-ons/addOnTypes';

export const ADD_ON_DESCRIPTION_TOO_LONG_ERROR = `Description must be ${ADD_ON_DESCRIPTION_MAX_LENGTH} characters or less.`;

export type NormalizeAddOnDescriptionResult =
  | { ok: true; description: string | null }
  | { ok: false; error: string };

/**
 * Trims a description to what the DB stores (`null` when blank) and rejects
 * anything past the limit here, so an over-long value surfaces a readable
 * message instead of a sanitized check-constraint failure.
 */
export function normalizeAddOnDescriptionForSave(
  raw: string | null | undefined
): NormalizeAddOnDescriptionResult {
  const description = raw?.trim() || null;
  if (description && description.length > ADD_ON_DESCRIPTION_MAX_LENGTH) {
    return { ok: false, error: ADD_ON_DESCRIPTION_TOO_LONG_ERROR };
  }
  return { ok: true, description };
}
