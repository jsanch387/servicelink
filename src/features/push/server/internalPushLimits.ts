/** Max lengths for internal push API bodies (Expo + abuse protection). */
export const INTERNAL_PUSH_TITLE_MAX = 120;
export const INTERNAL_PUSH_BODY_MAX = 500;
export const INTERNAL_PUSH_REFERENCE_TYPE_MAX = 64;
export const INTERNAL_PUSH_REFERENCE_ID_MAX = 256;
export const INTERNAL_PUSH_TEST_EMAIL_MAX = 254;

export function internalPushStringWithinMax(
  value: string,
  max: number
): boolean {
  return value.length > 0 && value.length <= max;
}
