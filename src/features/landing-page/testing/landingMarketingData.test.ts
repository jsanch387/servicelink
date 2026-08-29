import { describe, expect, it } from 'vitest';
import {
  instagramReelEmbedUrl,
  instagramReelShortcode,
  instagramReelUrl,
  tiktokEmbedUrl,
  tiktokVideoUrl,
} from '@/constants/marketingSocial';
import { LANDING_FEATURE_TRIO } from '../data/landingFeatureTrio';
import { LANDING_HOW_IT_WORKS } from '../data/landingHowItWorks';
import { LANDING_INSTAGRAM_REELS } from '../data/landingInstagram';
import {
  LANDING_LIVE_SHOPS,
  landingLiveShopHref,
} from '../data/landingLiveShops';
import { LANDING_TESTIMONIALS } from '../data/landingTestimonials';
import {
  LANDING_TIKTOK_HANDLE,
  LANDING_TIKTOK_VIDEO_IDS,
} from '../data/landingTikTok';

describe('landing marketing data', () => {
  it('builds public shop paths', () => {
    expect(LANDING_LIVE_SHOPS.map(shop => shop.slug)).toEqual([
      'blacklabelauto',
      'nanobluedetails',
      'ridefreshdetailing',
      'apexmobile',
      'elev8te',
    ]);
    expect(LANDING_LIVE_SHOPS.every(shop => shop.image.length > 0)).toBe(true);
    expect(landingLiveShopHref('blacklabelauto')).toBe('/blacklabelauto');
    expect(landingLiveShopHref('nanobluedetails')).toBe('/nanobluedetails');
  });

  it('keeps the homepage workflow and feature trio intact', () => {
    expect(LANDING_HOW_IT_WORKS.map(step => step.id)).toEqual([
      'share',
      'book',
      'notify',
      'paid',
    ]);
    expect(LANDING_FEATURE_TRIO.map(card => card.id)).toEqual([
      'storefront',
      'dashboard',
      'app',
    ]);
    expect(
      LANDING_FEATURE_TRIO.every(card => card.shortBullets.length === 4)
    ).toBe(true);
  });

  it('uses the App Store reviews, not mock shops', () => {
    expect(LANDING_TESTIMONIALS.map(review => review.id)).toEqual([
      'tray0611',
      'jsanjim',
      'noah-lomprey',
      'apex-mobile',
      'nanoblue',
      'hi-bye',
      'cayden',
    ]);
    expect(LANDING_TESTIMONIALS.some(review => review.name === 'Mike A.')).toBe(
      false
    );
  });

  it('builds TikTok embed and watch URLs', () => {
    expect(tiktokEmbedUrl('1234567890')).toBe(
      'https://www.tiktok.com/embed/v2/1234567890'
    );
    expect(tiktokVideoUrl('1234567890')).toBe(
      `https://www.tiktok.com/@${LANDING_TIKTOK_HANDLE}/video/1234567890`
    );
    expect(LANDING_TIKTOK_VIDEO_IDS).toEqual(['7660706203663633677']);
  });

  it('parses Instagram reel links and builds embed URLs', () => {
    expect(LANDING_INSTAGRAM_REELS).toEqual([
      'DcjSZUztE1O',
      'DcSG12HNt-r',
      'DamDBactnIH',
    ]);
    expect(
      instagramReelShortcode(
        'https://www.instagram.com/reel/DcjSZUztE1O/?utm_source=ig_web_copy_link'
      )
    ).toBe('DcjSZUztE1O');
    expect(instagramReelUrl('DcSG12HNt-r')).toBe(
      'https://www.instagram.com/reel/DcSG12HNt-r/'
    );
    expect(instagramReelEmbedUrl('DcSG12HNt-r')).toBe(
      'https://www.instagram.com/reel/DcSG12HNt-r/embed/?hidecaption=1'
    );
  });
});
