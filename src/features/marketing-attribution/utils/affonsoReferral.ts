export const AFFONSO_REFERRAL_COOKIE = 'affonso_referral';

declare global {
  interface Window {
    affonso_referral?: string;
  }
}

/** Client-side referral ID from the Affonso pixel (`window` first, then cookie). */
export function getAffonsoReferralId(): string {
  if (typeof window === 'undefined') return '';

  const fromWindow =
    typeof window.affonso_referral === 'string'
      ? window.affonso_referral.trim()
      : '';
  if (fromWindow) return fromWindow;

  try {
    const match = document.cookie.match(/(?:^|; )affonso_referral=([^;]*)/);
    return match?.[1] ? decodeURIComponent(match[1]).trim() : '';
  } catch {
    return '';
  }
}
