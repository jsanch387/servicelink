import { ROUTES } from '@/constants/routes';
import { blogGuideSignupPath } from '@/features/marketing-attribution';
import { GuideFaqAccordion } from '@/features/resources/components/GuideFaqAccordion';
import { GuideProTip } from '@/features/resources/components/GuideCallouts';
import { getGuideBySlug } from '@/features/resources/data/guides';
import Link from 'next/link';

import {
  comparisonHeaderClasses,
  comparisonRowClasses,
  h2Classes,
  linkClasses,
  orderedListClasses,
  pClasses,
  sectionClasses,
} from './guideContentStyles';

const SLUG = 'servicelink-vs-detaildeck';
const GUIDE_FAQS = getGuideBySlug(SLUG)?.faqs ?? [];

const tableHeaderClasses = `${comparisonHeaderClasses} grid-cols-3`;
const tableRowClasses = `${comparisonRowClasses} grid-cols-3`;

const TABLE_ROWS = [
  ['Built for', 'Solo mobile detailers', 'Solo mobile detailers'],
  [
    'Price (Nov 2026)',
    'Free for 5 appointments, then Pro $20/mo',
    '$29/mo Solo Pro',
  ],
  ['Customer books from', 'One bio link, guest checkout', 'Booking link'],
  ['Sedan / SUV / truck pricing', 'Built in on Pro', 'Confirm on their site'],
  ['Deposits', 'Yes, at checkout on Pro', 'Yes'],
  [
    'Reminders and review requests',
    'SMS/email confirmations, day-before reminder, review ask after the job',
    'Confirm on their site',
  ],
  [
    'Google reviews on the page',
    'Connect Google Business Profile',
    'Confirm on their site',
  ],
  ['Expenses, quotes, Tap to Pay', 'Yes on Pro', 'Confirm current extras'],
  ['Ease of use', 'Simple to use and adjust', 'More setup, more taps'],
] as const;

export function DetailDeckAlternativeMobileDetailersContent() {
  return (
    <>
      <section className={sectionClasses}>
        <h2 className={h2Classes}>What you actually need</h2>
        <p className={pClasses}>
          You don’t need another generic SaaS dashboard. You need a booking
          link, sedan / SUV / truck prices, deposits when no-shows start
          hurting, a client list from every job, reminders before the visit, and
          a review request when you finish. ServiceLink is the app built to do
          that on a one-truck week.
        </p>
        <ol className={orderedListClasses}>
          <li>A link for your Instagram bio</li>
          <li>Sedan / SUV / truck prices on the menu</li>
          <li>Deposits when no-shows start hurting</li>
          <li>Names and numbers from every booking so you can rebook</li>
          <li>
            Reminders and a review ask that go out without you typing them
          </li>
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
        <h2 className={h2Classes}>
          Why solo mobile detailers pick ServiceLink
        </h2>
        <p className={pClasses}>
          <Link href="/" className={linkClasses}>
            ServiceLink
          </Link>{' '}
          is built for owner-operators who book from Instagram. Customers open
          myservicelink.app/yourname, pick a service and time, done — no
          customer app. You can change a price, an hour, or a service between
          jobs without hunting through menus. Confirmations, day-before
          reminders, and a review request after the job run in the background.
          Connect Google and those reviews show on the same booking page.
        </p>
        <p className={pClasses}>
          Free covers the first 5 appointments. Pro is $20/month or $200/year
          for unlimited bookings, vehicle-size prices, deposits, Tap to Pay,
          quotes, invoices, and expenses. That is the better everyday setup for
          a one-truck shop.
        </p>
        <p className={pClasses}>
          <strong className="text-gray-300">DetailDeck</strong> is also
          mobile-first booking for solos: a link, deposits, no customer app
          (confirm the latest on mydetaildeck.com). As of November 2026 they
          publish one $29/month plan. Fine tool. ServiceLink is the simpler one
          to live in—and the cheaper start.
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
          shops. ServiceLink is the one we would run.
        </p>

        <div className="mb-6 overflow-x-auto rounded-xl border border-white/10">
          <div className="min-w-[28rem]">
            <div className={tableHeaderClasses}>
              <span>Category</span>
              <span className="text-white">ServiceLink</span>
              <span>DetailDeck</span>
            </div>
            {TABLE_ROWS.map(([category, serviceLink, detailDeck], index) => (
              <div
                key={category}
                className={`${tableRowClasses}${
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
          the same on paper. ServiceLink is the one you can adjust on the
          driveway—and the one that asks for the review when you tap complete.
        </GuideProTip>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>Who DetailDeck is built for</h2>
        <p className={pClasses}>
          DetailDeck is aimed at the same solo mobile detailer. Both tools sell
          a booking link. The difference is the week you actually live: price,
          how fast you can change a package, whether reminders and review
          requests go out for you, and whether expenses and Tap to Pay sit in
          the same $20 Pro plan. ServiceLink is the better pick for that week.
        </p>
        <p className={pClasses}>
          Coming from Jobber-sized field-service software instead?{' '}
          <Link
            href={ROUTES.RESOURCE_GUIDE('jobber-alternative-mobile-detailers')}
            className={linkClasses}
          >
            Jobber alternative for mobile detailers
          </Link>
          . CRM roundup:{' '}
          <Link
            href={ROUTES.RESOURCE_GUIDE('best-crm-for-mobile-detailers')}
            className={linkClasses}
          >
            best CRM for mobile detailers
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
            Drop the link in your Instagram bio (leave the old link up a week if
            you want)
          </li>
          <li>Reply to DMs with the link once — stop typing availability</li>
          <li>
            Turn on deposits if no-shows start eating your Saturday. Reminders
            and review requests start on the first real job
          </li>
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
          get the client, the reminder, and the review ask.{' '}
          <Link href={blogGuideSignupPath(SLUG)} className={linkClasses}>
            Get your booking link
          </Link>
          .
        </p>
      </section>
    </>
  );
}
