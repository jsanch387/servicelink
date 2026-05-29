import { IOS_APP_STORE_URL } from '@/constants/appStore';
import { IosAppStoreButton } from '@/components/shared/IosAppStoreButton';

/** Temporary promo: iOS app is live on the App Store. */
export function IosAppLiveBanner() {
  if (!IOS_APP_STORE_URL) return null;

  return (
    <div className="relative mb-5 sm:mb-6 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <span className="absolute top-0 right-4 -translate-y-1/2 inline-flex rounded-full border border-emerald-500/30 bg-[var(--dashboard-bg)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-400">
        New
      </span>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-200">
            ServiceLink is on iPhone.
          </p>
          <p className="mt-0.5 text-sm leading-snug text-zinc-500">
            Download and sign in with your account.
          </p>
        </div>
        <IosAppStoreButton className="shrink-0" />
      </div>
    </div>
  );
}
