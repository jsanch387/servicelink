import { GOOGLE_PLAY_STORE_URL, IOS_APP_STORE_URL } from '@/constants/appStore';
import { androidPlayIntentUrl } from '@/constants/getApp';
import { MARKETING_IMAGES } from '@/constants/marketingImages';
import { StoreBadges } from '@/features/app-pitch/components/StoreBadges';
import { detectOs, isInAppBrowser } from '@/libs/device/detectDevice';
import { headers } from 'next/headers';
import Image from 'next/image';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function GetAppPage() {
  const ua = (await headers()).get('user-agent') ?? '';
  const os = detectOs(ua);
  if (os === 'ios') redirect(IOS_APP_STORE_URL);
  if (os === 'android') {
    redirect(
      isInAppBrowser(ua) ? androidPlayIntentUrl() : GOOGLE_PLAY_STORE_URL
    );
  }

  return (
    <main className="flex min-h-screen items-start justify-center bg-[#0f0f0f] px-6 pb-4 pt-2 text-white sm:items-center sm:px-8 sm:py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-16">
        <figure className="shrink-0">
          <Image
            src={MARKETING_IMAGES.features.homeScreen}
            alt="ServiceLink app home screen on a phone"
            width={1284}
            height={2778}
            priority
            className="h-[min(81dvh,690px)] w-auto sm:h-[min(78dvh,680px)]"
          />
        </figure>
        <div className="w-full max-w-md text-center sm:text-left">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Run your business from your pocket
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Get the ServiceLink app. New bookings show up on your phone.
          </p>
          <div className="mt-3 flex justify-center sm:mt-6 sm:justify-start">
            <StoreBadges height={48} />
          </div>
        </div>
      </div>
    </main>
  );
}
