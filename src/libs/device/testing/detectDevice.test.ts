import { describe, expect, it } from 'vitest';

import { detectClass, detectOs, isInAppBrowser } from '../detectDevice';

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const IPAD =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
const ANDROID =
  'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
const DESKTOP =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

describe('detectDevice', () => {
  it('treats an iPhone as a phone', () => {
    expect(detectOs(IPHONE)).toBe('ios');
    expect(detectClass(IPHONE)).toBe('mobile');
  });

  it('treats iPadOS as a tablet even when the browser says Mac', () => {
    expect(detectOs(IPAD, 5)).toBe('ios');
    expect(detectClass(IPAD, 5)).toBe('tablet');
    expect(detectClass(IPAD, 0)).toBe('desktop');
  });

  it('treats Android phones as Android', () => {
    expect(detectOs(ANDROID)).toBe('android');
    expect(detectClass(ANDROID)).toBe('mobile');
  });

  it('keeps a desktop computer on the QR layout', () => {
    expect(detectOs(DESKTOP)).toBe('other');
    expect(detectClass(DESKTOP)).toBe('desktop');
  });

  it('recognizes TikTok and Instagram browsers', () => {
    expect(isInAppBrowser(`${IPHONE} TikTok`)).toBe(true);
    expect(isInAppBrowser(`${ANDROID} Instagram`)).toBe(true);
    expect(isInAppBrowser(DESKTOP)).toBe(false);
  });
});
