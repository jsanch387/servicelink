import { isValidEmail } from '@/features/auth/utils/validation';

export function getAdsWorkshopEmailError(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return 'Email is required';
  if (!isValidEmail(trimmed)) return 'Enter a valid email address';
  return null;
}
