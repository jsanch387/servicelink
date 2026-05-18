/** Max characters for business bio (edit profile + onboarding). */
export const BUSINESS_BIO_MAX_LENGTH = 1000;

export function getBioLengthValidationError(bio: string): string | null {
  if (bio.trim().length > BUSINESS_BIO_MAX_LENGTH) {
    return `Bio must be ${BUSINESS_BIO_MAX_LENGTH} characters or fewer`;
  }
  return null;
}
