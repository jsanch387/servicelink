import { FramedCtaButton } from '@/components/shared';
import { Footer } from '@/features/landing-page/components/Footer';
import { MarketingNavigation } from '@/features/landing-page/components/MarketingNavigation';
import { MARKETING_NAV_SPACER_CLASS } from '@/features/landing-page/components/navStyles';
import {
  AFFILIATE_COMMISSION,
  AFFILIATE_EARNING_EXAMPLES,
  AFFILIATE_FAQS,
  AFFILIATE_HERO,
  AFFILIATE_PORTAL_URL,
  AFFILIATE_STEPS,
  AFFILIATE_WHO,
} from '../data/affiliateProgramContent';

function AffiliateApplyButton({ className }: { className?: string }) {
  return (
    <FramedCtaButton
      href={AFFILIATE_PORTAL_URL}
      showArrow
      className={className}
    >
      Become an affiliate
    </FramedCtaButton>
  );
}

export function AffiliateProgramPage() {
  const { percent, proMonthlyUsd, perReferralMonthlyUsd } =
    AFFILIATE_COMMISSION;

  return (
    <div className="min-h-screen bg-[var(--dashboard-bg)] flex flex-col">
      <MarketingNavigation />
      <div className={MARKETING_NAV_SPACER_CLASS} aria-hidden />
      <div className="h-4 sm:h-6 shrink-0" aria-hidden />

      <main
        id="main-content"
        className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 md:py-16 pb-14 sm:pb-20"
      >
        <header className="mb-10 sm:mb-14 text-center max-w-3xl mx-auto">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
            {AFFILIATE_HERO.eyebrow}
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-[1.1]">
            {AFFILIATE_HERO.title}
          </h1>
          <p className="mt-4 text-base sm:text-lg text-gray-400 leading-relaxed">
            {AFFILIATE_HERO.subtitle}
          </p>
          <div className="mt-8 flex justify-center">
            <AffiliateApplyButton />
          </div>
        </header>

        <section
          aria-labelledby="affiliate-math-heading"
          className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-8 sm:px-8 sm:py-10"
        >
          <h2
            id="affiliate-math-heading"
            className="text-center text-xl sm:text-2xl font-bold text-white tracking-tight"
          >
            The math
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            One referred Pro subscriber.
          </p>

          <p className="mt-8 text-center font-semibold tracking-tight text-white">
            <span className="text-2xl sm:text-3xl">${proMonthlyUsd}</span>
            <span className="mx-2 text-gray-500">×</span>
            <span className="text-2xl sm:text-3xl">{percent}%</span>
            <span className="mx-2 text-gray-500">=</span>
            <span className="text-2xl sm:text-3xl text-orange-300">
              ${perReferralMonthlyUsd}/mo
            </span>
          </p>
          <p className="mt-3 text-center text-sm text-gray-500">
            Paid every month they stay on Pro.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            {AFFILIATE_EARNING_EXAMPLES.map(example => (
              <div
                key={example.referrals}
                className="rounded-xl border border-white/[0.08] bg-black/20 px-4 py-5 text-center"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {example.referrals} Pro referrals
                </p>
                <p className="mt-2 text-2xl font-bold text-white tracking-tight">
                  ${example.monthlyUsd}
                  <span className="text-sm font-medium text-gray-500">/mo</span>
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  ${example.yearlyUsd.toLocaleString()} a year if they stay
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="affiliate-steps-heading"
          className="mt-12 sm:mt-16"
        >
          <h2
            id="affiliate-steps-heading"
            className="text-xl sm:text-2xl font-bold text-white tracking-tight"
          >
            How it works
          </h2>
          <ol className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {AFFILIATE_STEPS.map(item => (
              <li
                key={item.step}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-6"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
                  {item.step}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">
                  {item.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section
          aria-labelledby="affiliate-who-heading"
          className="mt-12 sm:mt-16"
        >
          <h2
            id="affiliate-who-heading"
            className="text-xl sm:text-2xl font-bold text-white tracking-tight"
          >
            Who this is for
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {AFFILIATE_WHO.map(item => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/[0.08] px-5 py-6"
              >
                <h3 className="text-base font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          className="mt-12 sm:mt-16"
          aria-labelledby="affiliate-faq-heading"
        >
          <h2
            id="affiliate-faq-heading"
            className="text-xl sm:text-2xl font-bold text-white mb-6 tracking-tight"
          >
            Frequently asked questions
          </h2>
          <div className="rounded-2xl border border-white/[0.08] overflow-hidden divide-y divide-white/[0.08]">
            {AFFILIATE_FAQS.map((faq, index) => (
              <details
                key={faq.question}
                className="group bg-white/[0.02] open:bg-white/[0.04] transition-colors"
                {...(index === 0 ? { open: true } : {})}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 sm:px-6 py-4 sm:py-5 text-left font-semibold text-white text-sm sm:text-base [&::-webkit-details-marker]:hidden">
                  <span className="pr-2">{faq.question}</span>
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/15 text-gray-400 text-lg leading-none transition-transform group-open:rotate-45 group-open:text-white"
                    aria-hidden
                  >
                    +
                  </span>
                </summary>
                <div className="px-5 sm:px-6 pb-5 sm:pb-6 -mt-1">
                  <p className="text-sm text-gray-400 leading-relaxed border-l-2 border-white/15 pl-4">
                    {faq.answer}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </section>

        <section
          className="mt-12 sm:mt-16 flex flex-col items-center text-center"
          aria-label="Apply to the ServiceLink affiliate program"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Ready to share your link?
          </h2>
          <p className="mt-3 max-w-md text-sm sm:text-base text-gray-400">
            Apply, grab your link, and earn $6 a month for every Pro subscriber
            you send.
          </p>
          <div className="mt-8">
            <AffiliateApplyButton />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
