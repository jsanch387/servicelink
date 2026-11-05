export type DeviceOs = 'ios' | 'android' | 'other';
export type DeviceClass = 'mobile' | 'tablet' | 'desktop';

function isIpadOs(ua: string, touchPoints: number): boolean {
  return /Macintosh/i.test(ua) && touchPoints > 1;
}

export function detectOs(ua: string, touchPoints = 0): DeviceOs {
  if (/iPhone|iPad|iPod/i.test(ua) || isIpadOs(ua, touchPoints)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'other';
}

export function detectClass(ua: string, touchPoints = 0): DeviceClass {
  if (/iPad/i.test(ua) || isIpadOs(ua, touchPoints)) return 'tablet';
  if (/iPhone|iPod/i.test(ua)) return 'mobile';
  if (/Android/i.test(ua)) {
    return /Mobile/i.test(ua) ? 'mobile' : 'tablet';
  }
  return 'desktop';
}

/** Instagram, Facebook, and TikTok keep the link inside their own browser. */
export function isInAppBrowser(ua: string): boolean {
  return /FBAN|FBAV|Instagram|TikTok|musical_ly|Bytedance/i.test(ua);
}
