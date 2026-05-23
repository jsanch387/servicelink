import { AdsWorkshopSignupButton } from './AdsWorkshopSignupButton';
import { WORKSHOP_POST_VIDEO_HOOK } from '../data/workshopWatchContent';

export function AdsWorkshopPostVideoHook() {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-4 sm:p-5 text-center space-y-3">
      <h2 className="text-base sm:text-lg font-semibold text-white text-balance">
        {WORKSHOP_POST_VIDEO_HOOK.title}
      </h2>
      <p className="text-sm text-gray-400 leading-relaxed text-pretty">
        {WORKSHOP_POST_VIDEO_HOOK.description}
      </p>
      <AdsWorkshopSignupButton
        variant="inverse"
        size="md"
        fullWidth
        className="sm:max-w-xs sm:mx-auto font-semibold"
      >
        Start free — set up your link
      </AdsWorkshopSignupButton>
    </div>
  );
}
