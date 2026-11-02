import { GlassCard } from '@/components/shared';
import { ChevronRightIcon, GiftIcon } from '@heroicons/react/24/outline';
import { AFFILIATE_PORTAL_URL } from '../data/affiliateProgramContent';

export function AffiliateReferralWidget() {
  return (
    <section className="w-full min-w-0">
      <h2 className="mb-2.5 text-base font-semibold text-white">Referrals</h2>
      <GlassCard
        padding="none"
        rounded="rounded-2xl"
        blurColor="bg-zinc-500"
        showBlur
        className="w-full min-w-0"
      >
        <a
          href={AFFILIATE_PORTAL_URL}
          className="flex min-h-[52px] cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-zinc-300">
              <GiftIcon className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-zinc-100">
                Share ServiceLink and get paid
              </span>
              <span className="mt-0.5 block text-xs text-zinc-500">
                Earn every month they stay on Pro
              </span>
            </span>
          </span>
          <ChevronRightIcon
            className="h-4 w-4 shrink-0 text-zinc-500"
            aria-hidden
          />
        </a>
      </GlassCard>
    </section>
  );
}
