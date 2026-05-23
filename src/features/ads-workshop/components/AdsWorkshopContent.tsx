'use client';

import { AdsWorkshopPlaybookBridge } from './AdsWorkshopPlaybookBridge';
import { AdsWorkshopPostVideoHook } from './AdsWorkshopPostVideoHook';
import { AdsWorkshopProductOffer } from './AdsWorkshopProductOffer';
import { AdsWorkshopSocialProof } from './AdsWorkshopSocialProof';
import { AdsWorkshopVideoPlayer } from './AdsWorkshopVideoPlayer';
import { WORKSHOP_WATCH_INTRO } from '../data/workshopWatchContent';

export function AdsWorkshopContent() {
  return (
    <div className="space-y-8 sm:space-y-10">
      <p className="text-sm text-gray-400 text-center leading-relaxed px-1 text-pretty">
        {WORKSHOP_WATCH_INTRO}
      </p>

      <AdsWorkshopVideoPlayer compact />

      <AdsWorkshopPostVideoHook />

      <div className="h-px bg-white/[0.06]" aria-hidden />

      <AdsWorkshopPlaybookBridge />

      <AdsWorkshopSocialProof />

      <AdsWorkshopProductOffer />
    </div>
  );
}
