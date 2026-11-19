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
  [
    'Ease of use',
    'Simple daily app. Live the same day',
    'Booking-link app. More taps',
  ],
  ['Customer booking', 'One bio link, guest checkout', 'Booking link'],
  [
    'Automations',
    'Confirmations, day-before reminder, on-the-way texts',
    'Confirm on their site',
  ],
  [
    'Reviews',
    'Review request after every job. Google reviews on the page',
    'Confirm on their site',
  ],
  [
    'Team',
    'Up to 4 people. Roles, job assignment, mobile app',
    'Confirm current seats',
  ],
  [
    'Deposits, Tap to Pay, expenses',
    'All on Pro, with quotes and invoices',
    'Stripe deposits. Confirm extras',
  ],
  [
    'Price / value (Nov 2026)',
    '5 appointments free. Pro $20/mo. Team $60/mo',
    '$29/mo Solo Pro',
  ],
] as const;

export function DetailDeckAlternativeMobileDetailersContent() {
  return (
    <>
      <section className={sectionClasses}>
        <h2 className={h2Classes}>What you actually need</h2>
        <p className={pClasses}>
          You need a booking link, sedan / SUV / truck prices, deposits when
          no-shows start hurting, a client list from every job, reminders before
          the visit, a review request when you finish, and a team that can run
          the next job from the phone. ServiceLink is that CRM.
        </p>
        <ol className={orderedListClasses}>
          <li>A link for Instagram, Google, and texts</li>
          <li>Sedan / SUV / truck prices on the menu</li>
          <li>Deposits when no-shows start hurting</li>
          <li>Names and numbers from every booking so you can rebook</li>
          <li>
            Reminders and a review ask that go out without you typing them
          </li>
          <li>Roles and job assignment when you hire (Team, up to 4)</li>
        </ol>
        <p className={pClasses}>
          Deposits deep-dive:{' '}
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
        <h2 className={h2Classes}>Why ServiceLink is the pick</h2>
        <p className={pClasses}>
          <Link href="/" className={linkClasses}>
            ServiceLink
          </Link>{' '}
          is the full detailing CRM. Customers open myservicelink.app/yourname,
          pick a service and time, done — no customer app. You can change a
          price, an hour, or an assignee between jobs. Confirmations, day-before
          reminders, and a review request after the job run in the background.
          Connect Google and those reviews show on the same booking page.
        </p>
        <p className={pClasses}>
          Five appointments free. Pro is $20/month or $200/year for unlimited
          bookings, vehicle-size prices, deposits, Tap to Pay, quotes, invoices,
          and expenses. Team is $60/month or $600/year for up to four people
          with Member, Coordinator, and Manager roles.
        </p>
        <p className={pClasses}>
          <strong className="text-gray-300">DetailDeck</strong> is another bio
          booking link with deposits and a client CRM (confirm the latest on
          mydetaildeck.com). As of November 2026 they publish one $29/month
          plan. ServiceLink is the better everyday system: automations, Google
          reviews on the page, expenses and Tap to Pay on Pro, Team, and a
          stronger start.
        </p>
        <p className={pClasses}>
          Urable and QuoteIQ are heavier stacks (
          <Link
            href={ROUTES.RESOURCE_GUIDE('servicelink-vs-urable')}
            className={linkClasses}
          >
            vs Urable
          </Link>
          ). This page is two booking-link tools. ServiceLink is the CRM: more
          automations, reviews on the page, Team, and a stronger start.
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
        <h2 className={h2Classes}>How DetailDeck compares</h2>
        <p className={pClasses}>
          DetailDeck sells a booking link. ServiceLink sells the shop: booking,
          CRM, automations, reviews, expenses, Tap to Pay, and Team. The
          difference is the week you actually live—and whether reminders, review
          requests, and a hire on the phone sit in the same $20 Pro / $60 Team
          stack.
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
          <li>
            When you hire, upgrade to Team. Invite them, pick a role, assign
            jobs from the board
          </li>
        </ol>
        <p className={pClasses}>
          Most shops are live in under 10 minutes.{' '}
          <Link href={blogGuideSignupPath(SLUG)} className={linkClasses}>
            Start ServiceLink
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
                    Start ServiceLink
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
        <h2 className={h2Classes}>Verdict: ServiceLink is the pick</h2>
        <p className={pClasses}>
          Put ServiceLink in your bio. Customers pick a service and a time. You
          get the client, the reminder, the review ask, and a team that can run
          the next job.{' '}
          <Link href={blogGuideSignupPath(SLUG)} className={linkClasses}>
            Start ServiceLink
          </Link>
          .
        </p>
      </section>
    </>
  );
}
