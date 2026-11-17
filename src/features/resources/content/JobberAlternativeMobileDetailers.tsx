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

const SLUG = 'jobber-alternative-mobile-detailers';
const GUIDE_FAQS = getGuideBySlug(SLUG)?.faqs ?? [];

const tableHeaderClasses = `${comparisonHeaderClasses} grid-cols-3`;
const tableRowClasses = `${comparisonRowClasses} grid-cols-3`;

export function JobberAlternativeMobileDetailersContent() {
  return (
    <>
      <p className={pClasses}>
        Jobber is a solid field-service tool. It was not built for a one-truck
        detailer who books out of Instagram. ServiceLink is.
      </p>
      <p className={pClasses}>
        If you are still answering “you free Saturday?” in DMs, then chasing a
        Venmo, you do not need a crew ops suite. You need a{' '}
        <strong className="text-gray-300">
          Jobber alternative for mobile detailers
        </strong>{' '}
        built around one booking link, reminders, and a client list. That is
        ServiceLink: free for the first 5 appointments, then Pro at $20/month or
        $200/year.
      </p>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>What mobile detailers actually need</h2>
        <p className={pClasses}>
          You do not need dispatch for a 12-person crew. You need five things:
        </p>
        <ol className={orderedListClasses}>
          <li>A link you can drop in your Instagram bio</li>
          <li>A service menu with sedan / SUV / truck prices</li>
          <li>Deposits so no-shows stop eating your Saturday</li>
          <li>
            A list of who booked, with their phone number, so you can rebook
            them later
          </li>
          <li>
            Confirmations, a day-before reminder, and a review request after the
            job
          </li>
        </ol>
        <p className={pClasses}>
          That is the job. Everything else is extra until you have two trucks.
          If deposits are the hole in your week, read{' '}
          <Link
            href={ROUTES.RESOURCE_GUIDE(
              'stop-no-shows-deposits-mobile-detailing'
            )}
            className={linkClasses}
          >
            how to stop no-shows and take deposits
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
          is the booking app built for mobile detailers. Customers open
          myservicelink.app/yourname, pick a service, pick a time, and book. No
          app download for them. You run the day from the web or your phone
          (iOS/Android)—including deposits and Tap to Pay on Pro. Every booking
          writes the CRM. Reminders go out the day before. When you mark the job
          complete, ServiceLink asks for a review. Connect Google and those
          reviews show on the same page.
        </p>
        <p className={pClasses}>
          <strong className="text-gray-300">Jobber</strong> is built for
          plumbers, cleaners, and lawn crews. Scheduling and invoicing are
          strong. For a solo mobile detailer that is extra screens and extra
          setup. There is no “one link in the bio” feel. Core starts at
          $29/month billed annually for one user on getjobber.com, as of
          November 2026 ($49/month with no commitment).
        </p>

        <div className="mb-6 overflow-x-auto rounded-xl border border-white/10">
          <div className="min-w-[28rem]">
            <div className={tableHeaderClasses}>
              <span>Category</span>
              <span className="text-white">ServiceLink</span>
              <span>Jobber</span>
            </div>
            <div className={tableRowClasses}>
              <span className="font-medium text-gray-300">Built for</span>
              <span className="text-gray-200">Mobile detailers</span>
              <span className="text-gray-400">Field service teams</span>
            </div>
            <div className={`${tableRowClasses} bg-white/[0.02]`}>
              <span className="font-medium text-gray-300">Price</span>
              <span className="text-gray-200">
                Free for 5 appointments, then Pro $20/mo
              </span>
              <span className="text-gray-400">
                Core from $29/mo annual, $49/mo monthly (1 user)
              </span>
            </div>
            <div className={tableRowClasses}>
              <span className="font-medium text-gray-300">
                Customer books from
              </span>
              <span className="text-gray-200">
                One bio link, guest checkout
              </span>
              <span className="text-gray-400">Client hub / requests</span>
            </div>
            <div className={`${tableRowClasses} bg-white/[0.02]`}>
              <span className="font-medium text-gray-300">Deposits</span>
              <span className="text-gray-200">Yes, at checkout on Pro</span>
              <span className="text-gray-400">Available</span>
            </div>
            <div className={tableRowClasses}>
              <span className="font-medium text-gray-300">
                Sedan vs SUV pricing
              </span>
              <span className="text-gray-200">Built in on Pro</span>
              <span className="text-gray-400">Generic line items</span>
            </div>
            <div className={`${tableRowClasses} bg-white/[0.02]`}>
              <span className="font-medium text-gray-300">
                Reminders and reviews
              </span>
              <span className="text-gray-200">
                Confirmations, day-before reminder, review request, Google
                reviews on the page
              </span>
              <span className="text-gray-400">
                Reminders on higher Jobber plans
              </span>
            </div>
            <div className={tableRowClasses}>
              <span className="font-medium text-gray-300">CRM</span>
              <span className="text-gray-200">
                Clients, vehicles, visit history, CSV import
              </span>
              <span className="text-gray-400">Full field-service CRM</span>
            </div>
            <div className={`${tableRowClasses} bg-white/[0.02]`}>
              <span className="font-medium text-gray-300">Tap to Pay</span>
              <span className="text-gray-200">Yes, in the ServiceLink app</span>
              <span className="text-gray-400">
                Confirm on Jobber’s current plans
              </span>
            </div>
          </div>
        </div>
        <GuideProTip>
          Turn on deposits for anything over an hour. The calendar fills with
          people who show up—not people who were just asking. Reminders and the
          review request run after that.
        </GuideProTip>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>Who Jobber is built for</h2>
        <p className={pClasses}>
          Jobber is built for multi-trade crews that need a bigger ops suite:
          dispatch-style scheduling, invoicing at crew scale, more users on
          Connect and Grow. That is a different business than a one-truck
          detailing week. Solo and two-person shops that book from Instagram
          pick ServiceLink because the bio link, the CRM, and the reminders are
          the whole product—not a module buried in a field-service console.
        </p>
        <p className={pClasses}>
          For a broader checklist, see the{' '}
          <Link
            href={ROUTES.RESOURCE_GUIDE(
              'best-booking-app-for-mobile-detailers'
            )}
            className={linkClasses}
          >
            best booking app for mobile detailers
          </Link>
          . CRM comparison:{' '}
          <Link
            href={ROUTES.RESOURCE_GUIDE('best-crm-for-mobile-detailers')}
            className={linkClasses}
          >
            best CRM for mobile detailers
          </Link>
          . Comparing a detailing-adjacent ops suite?{' '}
          <Link
            href={ROUTES.RESOURCE_GUIDE('servicelink-vs-urable')}
            className={linkClasses}
          >
            Urable alternative
          </Link>
          .
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>How to move this week</h2>
        <ol className={orderedListClasses}>
          <li>
            Make your ServiceLink and add your top 4 services with vehicle
            prices
          </li>
          <li>Turn on deposits for anything over an hour (Pro)</li>
          <li>
            Put the link in your Instagram bio. Leave the old Jobber link up for
            a week if you want
          </li>
          <li>
            When someone DMs you, send the link once. Stop typing your
            availability by hand
          </li>
        </ol>
        <p className={pClasses}>
          Most detailers are live in under 10 minutes.{' '}
          <Link href={blogGuideSignupPath(SLUG)} className={linkClasses}>
            Start free
          </Link>
          .
        </p>
      </section>

      {GUIDE_FAQS.length ? (
        <GuideFaqAccordion
          items={GUIDE_FAQS.map(faq => ({
            question: faq.question,
            answer:
              faq.question === 'How do I try ServiceLink?' ? (
                <>
                  {faq.answer}{' '}
                  <Link
                    href={blogGuideSignupPath(SLUG)}
                    className={linkClasses}
                  >
                    Start free
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
        <h2 className={h2Classes}>Ready to stop booking out of your DMs?</h2>
        <p className={pClasses}>
          Put one booking link in your bio. Customers pick a service and a time.
          You get the client, the reminder, and the review ask.{' '}
          <Link href={blogGuideSignupPath(SLUG)} className={linkClasses}>
            Start free
          </Link>
          .
        </p>
      </section>
    </>
  );
}
