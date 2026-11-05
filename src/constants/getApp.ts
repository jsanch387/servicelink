import { GOOGLE_PLAY_STORE_URL } from '@/constants/appStore';

/** Public page a phone opens from the desktop QR. It sends them to the right store. */
export const GET_APP_URL = 'https://myservicelink.app/get-app';

const PLAY_PACKAGE = 'com.myservicelink.app';

export function androidPlayIntentUrl(): string {
  const fallback = encodeURIComponent(GOOGLE_PLAY_STORE_URL);
  return `intent://details?id=${PLAY_PACKAGE}#Intent;scheme=market;package=com.android.vending;S.browser_fallback_url=${fallback};end`;
}
