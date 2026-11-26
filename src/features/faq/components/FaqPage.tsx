import { ROUTES } from '@/constants/routes';
import { HeroCtaButton } from '@/features/landing-page/components/HeroCtaButton';
import { MarketingFooter } from '@/features/landing-page/components/MarketingFooter';
import { MarketingNavigation } from '@/features/landing-page/components/MarketingNavigation';
import { siteSignupPath } from '@/features/marketing-attribution';
import Link from 'next/link';
import { FAQ_INTERNAL_LINKS, FAQ_PAGE_ENTRIES } from '../data/faqPageContent';

export function FaqPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--dashboard-bg)]">
      <MarketingNavigation />
      <div className="h-16 shrink-0 sm:h-20 lg:h-24" aria-hidden />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
          FAQ
        </p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
          Questions detailers actually ask
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-gray-400 sm:text-lg">
          Booking, deposits, CRM, SMS, and Free vs Pro — without the sales maze.
          Customers book on a web link. You run the shop.
        </p>

        <div className="mt-10 space-y-2">
          {FAQ_PAGE_ENTRIES.map(faq => (
            <details
              key={faq.question}
              className="group overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02] open:bg-white/[0.03]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left marker:content-none hover:bg-white/[0.03] [&::-webkit-details-marker]:hidden">
                <span className="pr-2 text-sm font-medium leading-snug text-white sm:text-base">
                  {faq.question}
                </span>
                <span
                  className="shrink-0 text-gray-500 transition-transform duration-200 group-open:rotate-45"
                  aria-hidden
                >
                  +
                </span>
              </summary>
              <p className="px-5 pb-5 text-sm leading-relaxed text-gray-400 sm:text-base">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>

        <ul className="mt-10 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
          {FAQ_INTERNAL_LINKS.map(link => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="cursor-pointer underline-offset-2 hover:text-white hover:underline"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-14 border-t border-white/[0.08] pt-10 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Start with a booking link
          </h2>
          <p className="mx-auto mt-3 max-w-md text-gray-400">
            Five appointments free. No card. Upgrade to Pro when you want
            deposits.
          </p>
          <div className="mt-6 flex justify-center">
            <HeroCtaButton href={siteSignupPath('faq', 'bottom')}>
              Start free
            </HeroCtaButton>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            <Link
              href={ROUTES.PRICING_PAGE}
              className="cursor-pointer hover:text-white"
            >
              See pricing
            </Link>
          </p>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
