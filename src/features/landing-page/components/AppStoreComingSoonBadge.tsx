import Image from 'next/image';

const APP_STORE_BADGE_SRC = '/appstore-sticker.svg';

/** App Store badge + coming soon; display-only until the iOS app ships. */
export function AppStoreComingSoonBadge() {
  return (
    <div className="mt-6 sm:mt-8 max-w-lg" aria-label="Coming soon">
      <p className="text-xs font-medium text-gray-500 mb-2.5">Coming soon</p>
      <div className="inline-flex opacity-75 cursor-default pointer-events-none select-none">
        <Image
          src={APP_STORE_BADGE_SRC}
          alt=""
          width={120}
          height={40}
          className="h-10 sm:h-11 w-auto"
          unoptimized
          aria-hidden
        />
      </div>
    </div>
  );
}
