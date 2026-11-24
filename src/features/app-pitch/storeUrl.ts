import { GOOGLE_PLAY_STORE_URL, IOS_APP_STORE_URL } from '@/constants/appStore';
import { androidPlayIntentUrl, GET_APP_URL } from '@/constants/getApp';
import {
  detectOs,
  isInAppBrowser,
  type DeviceOs,
} from '@/libs/device/detectDevice';

/** Where the Get the app button goes for this browser. */
export function storeUrlForBrowser(ua: string, touchPoints = 0): string {
  const os: DeviceOs = detectOs(ua, touchPoints);
  if (os === 'ios') return IOS_APP_STORE_URL;
  if (os === 'android') {
    return isInAppBrowser(ua) ? androidPlayIntentUrl() : GOOGLE_PLAY_STORE_URL;
  }
  return GET_APP_URL;
}
