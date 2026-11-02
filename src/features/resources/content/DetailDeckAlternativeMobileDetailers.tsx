import { ROUTES } from '@/constants/routes';
import { blogGuideSignupPath } from '@/features/marketing-attribution';
import { GuideFaqAccordion } from '@/features/resources/components/GuideFaqAccordion';
import { GuideProTip } from '@/features/resources/components/GuideCallouts';
import { getGuideBySlug } from '@/features/resources/data/guides';
import Link from 'next/link';

import {
  h2Classes,
  linkClasses,
  pClasses,
  sectionClasses,
} from './guideContentStyles';

const SLUG = 'servicelink-vs-detaildeck';
const GUIDE_FAQS = getGuideBySlug(SLUG)?.faqs ?? [];

const orderedListClasses =
  'list-decimal list-outside space-y-2.5 text-gray-400 mb-5 ml-5 marker:text-gray-500';
const comparisonHeaderClasses =
  'grid grid-cols-3 gap-2 sm:gap-3 px-3 sm:px-5 py-3 bg-white/[0.04] border-b border-white/10 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400';
const comparisonRowClasses =
  'grid grid-cols-3 gap-2 sm:gap-3 px-3 sm:px-5 py-3.5 border-b border-white/10 last:border-b-0 text-xs sm:text-sm';

const TABLE_ROWS = [
  ['Built for', 'Solo mobile detailers', 'Solo mobile detailers'],
  ['Customer books from', 'One bio link', 'Booking link'],
  ['Sedan / SUV / truck pricing', 'Built in', 'Not clearly listed'],
  ['Deposits', 'Yes', 'Yes'],
  ['Tap to Pay on iPhone', 'Yes', 'Not advertised'],
  ['Ease of use', 'Simple to use and adjust', 'More setup, more taps'],
  ['Day-to-day feel', 'Lean, built for the driveway', 'Generic booking app'],
] as const;

export function DetailDeckAlternativeMobileDetailersContent() {
  return (
    <>
      <section className={sectionClasses}>
        <h2 className={h2Classes}>What you actually need</h2>
        <p className={pClasses}>
          You don’t need another generic SaaS dashboard. You need four things:
        </p>
        <ol className={orderedListClasses}>
          <li>A link for your Instagram bio</li>
          <li>Sedan / SUV / truck prices on the menu</li>
          <li>Deposits when no-shows start hurting</li>
          <li>Names and numbers from every booking so you can rebook</li>
        </ol>
        <p className={pClasses}>
          That’s it. Deposits deep-dive:{' '}
          <Link
            href={ROUTES.RESOURCE_GUIDE(
              'stop-no-shows-deposits-mobile-detailing'
            )}
            className={linkClasses}
          >
            how to stop no-shows and take deposits
          </Link>
          . Broader checklist:{' '}
          <Link
            href={ROUTES.RESOURCE_GUIDE(
              'best-booking-app-for-mobile-detailers'
            )}
            className={linkClasses}
          >
            best booking app for mobile detailers
          </Link>
          .
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>ServiceLink vs DetailDeck</h2>
        <p className={pClasses}>
          <Link href="/" className={linkClasses}>
            ServiceLink
          </Link>{' '}
          is built for owner-operators who book from Instagram. Customers open
          myservicelink.app/yourname, pick a service and time, done — no
          customer app. You can change a price, an hour, or a service between
          jobs without hunting through menus. Detailers who have tried the other
          options keep saying the same thing in reviews and feedback: it is just
          easier. That is the better everyday setup for a one-truck shop.
        </p>
        <p className={pClasses}>
          <strong className="text-gray-300">DetailDeck</strong> is also
          mobile-first booking for solos: a link, deposits, no customer app
          (confirm the latest on mydetaildeck.com). Fine tool. It just feels
          like a lot of other AI-era booking apps — clean, generic, same
          playbook. Vehicle-size prices and Tap to Pay are not clearly listed.
        </p>
        <p className={pClasses}>
          Urable and QuoteIQ are heavier stacks (
          <Link
            href={ROUTES.RESOURCE_GUIDE('servicelink-vs-urable')}
            className={linkClasses}
          >
            vs Urable
          </Link>
          ). This page is the close fight: two bio-link tools for one-truck
          shops. ServiceLink is the one we would run — simpler to live in,
          simpler to tweak.
        </p>

        <div className="mb-6 overflow-x-auto rounded-xl border border-white/10">
          <div className="min-w-[28rem]">
            <div className={comparisonHeaderClasses}>
              <span>Category</span>
              <span className="text-white">ServiceLink</span>
              <span>DetailDeck</span>
            </div>
            {TABLE_ROWS.map(([category, serviceLink, detailDeck], index) => (
              <div
                key={category}
                className={`${comparisonRowClasses}${
                  index % 2 === 1 ? ' bg-white/[0.02]' : ''
                }`}
              >
                <span className="font-medium text-gray-300">{category}</span>
                <span className="text-gray-200">{serviceLink}</span>
                <span className="text-gray-400">{detailDeck}</span>
              </div>
            ))}
          </div>
        </div>
        <GuideProTip>
          If you open the app ten times a day, simple wins. Feature lists look
          the same. Reviews keep pointing at how easy ServiceLink is to use and
          adjust compared with the other booking apps.
        </GuideProTip>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>When to stay on DetailDeck</h2>
        <p className={pClasses}>
          Stay if you already like their flow and the calendar works. Switching
          tools mid-season for sport is dumb.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>When to switch (most solos)</h2>
        <p className={pClasses}>
          Switch if the other app feels like work just to change a price or move
          a slot. Switch if you want something you can adjust on the driveway
          without thinking. Switch if you want the tool detailers keep calling
          easier than the rest.
        </p>
        <p className={pClasses}>
          Coming from Jobber-sized bloat instead?{' '}
          <Link
            href={ROUTES.RESOURCE_GUIDE('jobber-alternative-mobile-detailers')}
            className={linkClasses}
          >
            Jobber alternative for mobile detailers
          </Link>
          .
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>How to move this week</h2>
        <ol className={orderedListClasses}>
          <li>
            Create ServiceLink and add your top 4 services with vehicle prices
          </li>
          <li>
            Drop the link in your Instagram bio (leave DetailDeck up a week if
            you want)
          </li>
          <li>Reply to DMs with the link once — stop typing availability</li>
          <li>Turn on deposits if no-shows start eating your Saturday</li>
        </ol>
        <p className={pClasses}>
          Most detailers are live in under 10 minutes.{' '}
          <Link href={blogGuideSignupPath(SLUG)} className={linkClasses}>
            Get your booking link
          </Link>
          .
        </p>
      </section>

      {GUIDE_FAQS.length ? (
        <GuideFaqAccordion
          items={GUIDE_FAQS.map(faq => ({
            question: faq.question,
            answer:
              faq.question === 'Is ServiceLink a DetailDeck alternative?' ? (
                <>
                  {faq.answer}{' '}
                  <Link
                    href={blogGuideSignupPath(SLUG)}
                    className={linkClasses}
                  >
                    Get your booking link
                  </Link>
                  .
                </>
              ) : (
                faq.answer
              ),
          }))}
        />
      ) : null}

      <section className={sectionClasses}>
        <h2 className={h2Classes}>Ready to book from one link?</h2>
        <p className={pClasses}>
          Put ServiceLink in your bio. Customers pick a service and a time. You
          detail.{' '}
          <Link href={blogGuideSignupPath(SLUG)} className={linkClasses}>
            Get your booking link
          </Link>
          .
        </p>
      </section>
    </>
  );
}
