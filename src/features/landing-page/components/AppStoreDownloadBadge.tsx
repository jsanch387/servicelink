import Image from 'next/image';
import { IOS_APP_STORE_URL } from '@/constants/appStore';

const APP_STORE_BADGE_SRC = '/appstore-sticker.svg';

type AppStoreDownloadBadgeProps = {
  className?: string;
};

/** Clickable App Store badge for the live ServiceLink iOS app. */
export function AppStoreDownloadBadge({
  className = '',
}: AppStoreDownloadBadgeProps) {
  if (!IOS_APP_STORE_URL) return null;

  return (
    <a
      href={IOS_APP_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`group inline-flex rounded-lg transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--dashboard-bg)] ${className}`}
      aria-label="Download ServiceLink on the App Store"
    >
      <Image
        src={APP_STORE_BADGE_SRC}
        alt="Download on the App Store"
        width={135}
        height={45}
        className="h-12 w-auto object-contain sm:h-14 opacity-90 transition-opacity duration-200 group-hover:opacity-100"
        unoptimized
      />
    </a>
  );
}
