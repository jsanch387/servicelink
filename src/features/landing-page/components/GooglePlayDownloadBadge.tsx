import { GOOGLE_PLAY_STORE_URL } from '@/constants/appStore';
import Image from 'next/image';

const GOOGLE_PLAY_BADGE_SRC = '/google-play.png';

const BADGE_IMAGE_CLASS = 'h-12 w-auto object-contain sm:h-14';

type GooglePlayDownloadBadgeProps = {
  className?: string;
};

/** Google Play badge — links out when live, otherwise a grayed-out coming-soon placeholder. */
export function GooglePlayDownloadBadge({
  className = '',
}: GooglePlayDownloadBadgeProps) {
  const isLive = Boolean(GOOGLE_PLAY_STORE_URL);

  const badge = (
    <Image
      src={GOOGLE_PLAY_BADGE_SRC}
      alt={isLive ? 'Get it on Google Play' : 'Google Play — Coming Soon'}
      width={155}
      height={45}
      className={`${BADGE_IMAGE_CLASS} ${
        isLive
          ? 'opacity-90 transition-opacity duration-200 group-hover:opacity-100'
          : 'opacity-40 grayscale'
      }`}
      unoptimized
    />
  );

  return (
    <div className={`inline-flex flex-col items-center gap-1.5 ${className}`}>
      {!isLive ? (
        <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
          Coming Soon
        </span>
      ) : null}

      {isLive ? (
        <a
          href={GOOGLE_PLAY_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex rounded-lg transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--dashboard-bg)]"
          aria-label="Get ServiceLink on Google Play"
        >
          {badge}
        </a>
      ) : (
        <span
          className="inline-flex cursor-default"
          aria-label="Google Play — Coming Soon"
        >
          {badge}
        </span>
      )}
    </div>
  );
}
