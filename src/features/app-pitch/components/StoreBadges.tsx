import { GOOGLE_PLAY_STORE_URL, IOS_APP_STORE_URL } from '@/constants/appStore';
import Image from 'next/image';

const APPLE = { width: 360, height: 120 };
const PLAY = { width: 478, height: 142 };

export function StoreBadges({ height = 40 }: { height?: number }) {
  const appleWidth = Math.round((APPLE.width / APPLE.height) * height);
  const playWidth = Math.round((PLAY.width / PLAY.height) * height);

  return (
    <div className="flex items-center gap-3">
      <a href={IOS_APP_STORE_URL} className="cursor-pointer">
        <Image
          src="/store/app-store-badge.png"
          alt="Download on the App Store"
          width={appleWidth}
          height={height}
        />
      </a>
      <a href={GOOGLE_PLAY_STORE_URL} className="cursor-pointer">
        <Image
          src="/store/google-play.png"
          alt="Get it on Google Play"
          width={playWidth}
          height={height}
        />
      </a>
    </div>
  );
}
