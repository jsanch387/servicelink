'use client';

import { Button } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { AdsWorkshopVideoPlayer } from './AdsWorkshopVideoPlayer';

export function AdsWorkshopContent() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-400 text-center sm:text-left">
        You are in. Press play on the full{' '}
        <span className="text-white font-medium">15-minute</span> class below.
      </p>
      <AdsWorkshopVideoPlayer />
      <div className="flex flex-col items-center gap-2 pt-2">
        <Button
          href={ROUTES.AUTH.SIGNUP}
          variant="inverse"
          size="lg"
          className="w-full sm:w-auto min-w-[240px] font-bold"
        >
          Create your ServiceLink
        </Button>
        <p className="text-xs text-gray-500 text-center max-w-sm">
          One booking link for services, quotes, and payments — free to start.
        </p>
      </div>
    </div>
  );
}
