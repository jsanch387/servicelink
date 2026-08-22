import { Button, GlassCard } from '@/components/shared';
import { GiftIcon } from '@heroicons/react/24/outline';
import {
  AFFILIATE_COMMISSION,
  AFFILIATE_PORTAL_URL,
} from '../data/affiliateProgramContent';

export function AffiliateReferralWidget() {
  return (
    <section className="w-full min-w-0 space-y-3">
      <h2 className="text-base font-semibold text-white">Referrals</h2>
      <GlassCard className="w-full min-w-0">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-orange-300">
            <GiftIcon className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">
              Earn {AFFILIATE_COMMISSION.percent}% on Pro referrals
            </p>
            <p className="mt-1 text-sm leading-relaxed text-gray-400">
              Share ServiceLink. You get $
              {AFFILIATE_COMMISSION.perReferralMonthlyUsd}/mo for each $
              {AFFILIATE_COMMISSION.proMonthlyUsd} Pro subscriber.
            </p>
          </div>
        </div>

        <div className="mt-4">
          <Button
            href={AFFILIATE_PORTAL_URL}
            variant="secondary"
            className="w-full sm:w-auto"
          >
            Get your referral link
          </Button>
        </div>
      </GlassCard>
    </section>
  );
}
