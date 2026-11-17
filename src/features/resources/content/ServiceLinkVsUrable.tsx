import { MARKETING_IMAGES } from '@/constants/marketingImages';
import { ROUTES } from '@/constants/routes';
import { blogGuideSignupPath } from '@/features/marketing-attribution';
import { GuideFaqAccordion } from '@/features/resources/components/GuideFaqAccordion';
import { GuideProTip } from '@/features/resources/components/GuideCallouts';
import { getGuideBySlug } from '@/features/resources/data/guides';
import Image from 'next/image';
import Link from 'next/link';

import {
  h2Classes,
  h3Classes,
  linkClasses,
  listClasses,
  pClasses,
  sectionClasses,
} from './guideContentStyles';

const SLUG = 'servicelink-vs-urable';
const GUIDE_FAQS = getGuideBySlug(SLUG)?.faqs ?? [];

const comparisonHeaderClasses =
  'grid grid-cols-3 gap-2 sm:gap-3 px-3 sm:px-5 py-3 bg-white/[0.04] border-b border-white/10 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400';
const comparisonRowClasses =
  'grid grid-cols-3 gap-2 sm:gap-3 px-3 sm:px-5 py-3.5 border-b border-white/10 last:border-b-0 text-xs sm:text-sm';
const figureClasses = 'my-8 flex flex-col items-center gap-3 sm:gap-4';
const figureCaptionClasses =
  'max-w-md text-center text-sm text-gray-500 leading-relaxed px-2';

function GuideFigure({
  src,
  alt,
  caption,
}: {
  src: string;
  alt: string;
  caption: string;
}) {
  return (
    <figure className={figureClasses}>
      <Image
        src={src}
        alt={alt}
        width={1284}
        height={2778}
        className="h-auto w-full max-w-[240px] sm:max-w-[280px]"
        sizes="(max-width: 640px) 240px, 280px"
      />
      <figcaption className={figureCaptionClasses}>{caption}</figcaption>
    </figure>
  );
}

export function ServiceLinkVsUrableContent() {
  return (
    <>
      <p className={pClasses}>
        If you searched{' '}
        <strong className="text-gray-300">Urable alternative</strong> or{' '}
        <strong className="text-gray-300">ServiceLink vs Urable</strong>, pick
        the detailing CRM. ServiceLink is the full booking and CRM system:
        public booking, automations, review requests, Google reviews on the
        page, expenses, Tap to Pay, and Team for up to four people. It is
        simpler to use. It is the pick.
      </p>
      <p className={pClasses}>
        Urable is a denser field-service platform. Online booking is listed on
        their Pro plan at $110/month as of November 2026. ServiceLink includes
        booking from day one—Pro $20/month, Team $60/month. More bookings, fewer
        no-shows, more reviews, less admin.
      </p>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>
          The real difference: detailing CRM vs field-service suite
        </h2>
        <p className={pClasses}>
          Urable sits in the “field service CRM” category. Those products often
          include routing, estimates, invoicing, inventory, and team tools in
          one place. That can mean more setup, more menus, and a UI that feels
          busy when a customer needed to book a Saturday interior.
        </p>
        <p className={pClasses}>
          ServiceLink is the detailing CRM. Customers open your link, pick a
          package, pick a time, and pay a deposit if you require one. You manage
          services, availability, today’s jobs, and teammates from a phone-sized
          dashboard. Simple to use is the win—not a smaller product.
        </p>
        <ul className={listClasses}>
          <li>One shareable booking page for Instagram, Google, and texts</li>
          <li>Sedan / SUV / truck pricing on each service</li>
          <li>Availability you control so only open slots show</li>
          <li>Deposits so no-shows stop eating fuel and time</li>
          <li>
            SMS confirmations, day-before reminders, and a review request after
            the job
          </li>
          <li>Team for up to four people: roles, job assignment, mobile app</li>
          <li>A UI you can run between jobs—not a cluttered ops console</li>
        </ul>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>ServiceLink vs Urable Snapshot</h2>
        <p className={pClasses}>
          Plans and feature lists change. The rows that matter are ease of use,
          booking, automations, reviews, team, and value. ServiceLink leads
          those.
        </p>

        <div className="mb-6 overflow-x-auto rounded-xl border border-white/10">
          <div className="min-w-[28rem]">
            <div className={comparisonHeaderClasses}>
              <span>Category</span>
              <span className="text-white">ServiceLink</span>
              <span>Urable</span>
            </div>
            <div className={comparisonRowClasses}>
              <span className="font-medium text-gray-300">Ease of use</span>
              <span className="text-gray-200">
                Simple daily app. Live the same day
              </span>
              <span className="text-gray-400">Broader field-service suite</span>
            </div>
            <div className={`${comparisonRowClasses} bg-white/[0.02]`}>
              <span className="font-medium text-gray-300">Setup</span>
              <span className="text-gray-200">
                Live the same day—services + hours + link
              </span>
              <span className="text-gray-400">
                More configuration before it feels simple
              </span>
            </div>
            <div className={comparisonRowClasses}>
              <span className="font-medium text-gray-300">UI</span>
              <span className="text-gray-200">
                Sleek booking page + organized app
              </span>
              <span className="text-gray-400">
                Denser screens, more modules
              </span>
            </div>
            <div className={`${comparisonRowClasses} bg-white/[0.02]`}>
              <span className="font-medium text-gray-300">Team</span>
              <span className="text-gray-200">
                Up to 4 people. Roles, job assignment, mobile app
              </span>
              <span className="text-gray-400">Unlimited users on Express</span>
            </div>
            <div className={comparisonRowClasses}>
              <span className="font-medium text-gray-300">
                Customer booking
              </span>
              <span className="text-gray-200">
                Guest checkout—no app download
              </span>
              <span className="text-gray-400">Online booking supported</span>
            </div>
            <div className={`${comparisonRowClasses} bg-white/[0.02]`}>
              <span className="font-medium text-gray-300">Deposits</span>
              <span className="text-gray-200">Yes—at checkout on Pro</span>
              <span className="text-gray-400">Available</span>
            </div>
            <div className={comparisonRowClasses}>
              <span className="font-medium text-gray-300">
                Reminders and reviews
              </span>
              <span className="text-gray-200">
                Confirmations, day-before reminder, review request, Google
                reviews on the page
              </span>
              <span className="text-gray-400">Confirm on the booking plan</span>
            </div>
            <div className={`${comparisonRowClasses} bg-white/[0.02]`}>
              <span className="font-medium text-gray-300">Price / value</span>
              <span className="text-gray-200">
                5 appointments free. Pro $20/mo. Team $60/mo
              </span>
              <span className="text-gray-400">
                Express $70/mo. Online booking listed on Pro $110/mo (Nov 2026)
              </span>
            </div>
          </div>
        </div>

        <GuideProTip>
          If you open the app ten times a day, simple wins. Feature lists look
          impressive. Clutter is what you feel on a job. ServiceLink is the full
          CRM without the maze.
        </GuideProTip>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>
          Why Detailers Pick ServiceLink Over Urable
        </h2>
        <p className={pClasses}>
          People move to{' '}
          <Link href="/" className={linkClasses}>
            ServiceLink
          </Link>{' '}
          when they wanted a booking system and ended up with a platform. The
          work is the same: publish packages, take the job, show up. The
          software should stay out of the way.
        </p>

        <h3 className={h3Classes}>1. Less bloat, faster daily use</h3>
        <p className={pClasses}>
          You do not need every field-service module to run a detailing shop.
          ServiceLink keeps the path short: services, schedule, bookings,
          payments, CRM, Team. That is easier to learn and harder to lose track
          of when you are already wet and behind.
        </p>
        <GuideFigure
          src={MARKETING_IMAGES.features.homeScreen}
          alt="ServiceLink home dashboard showing today’s jobs and booking link on a phone"
          caption="Today’s jobs and your booking link—without a maze of extra menus."
        />

        <h3 className={h3Classes}>
          2. A booking page customers actually finish
        </h3>
        <p className={pClasses}>
          Your customer is standing in a driveway or scrolling Instagram. They
          will not hunt through a heavy portal. ServiceLink’s public page is
          built to look premium and finish in a few taps—no account wall, no app
          download.
        </p>
        <GuideFigure
          src={MARKETING_IMAGES.features.bookingLink}
          alt="ServiceLink customer booking page compared with heavier field service software"
          caption="Customers book as guests. You get the job without a 12-message DM thread."
        />

        <h3 className={h3Classes}>3. Organized without looking messy</h3>
        <p className={pClasses}>
          Service menus, vehicle pricing, quotes, and the calendar live in one
          place. You are not reconstructing the job from texts. When the day is
          packed, organization is the product—not another settings panel.
        </p>
        <GuideFigure
          src={MARKETING_IMAGES.features.services}
          alt="ServiceLink organized service menu with vehicle-based detailing prices"
          caption="Clear packages and prices. Customers pick a size instead of asking you to quote."
        />

        <h3 className={h3Classes}>4. Deposits that lock the slot</h3>
        <p className={pClasses}>
          Collect a deposit or full payment on the link so premium interiors are
          committed before you drive. Pair that with a simple cancellation rule.{' '}
          <Link
            href={ROUTES.RESOURCE_GUIDE(
              'stop-no-shows-deposits-mobile-detailing'
            )}
            className={linkClasses}
          >
            How to stop no-shows with deposits
          </Link>
          .
        </p>
        <GuideFigure
          src={MARKETING_IMAGES.features.payments}
          alt="ServiceLink deposit checkout for mobile detailing appointments"
          caption="Deposits at checkout. The calendar stays full of people who show up."
        />
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>How Urable compares</h2>
        <p className={pClasses}>
          Urable is a wider field-service platform: more modules, more
          configuration, a denser console. ServiceLink is the detailing CRM
          shops actually open: booking from day one, reminders, review requests,
          expenses, Tap to Pay, and Team for up to four people. Online booking
          on Urable is listed on Pro at $110/month as of November 2026.
          ServiceLink is the pick.
        </p>
        <p className={pClasses}>
          For a three-way look at other detailing tools, read{' '}
          <Link
            href={ROUTES.RESOURCE_GUIDE(
              'servicelink-vs-detail-connect-vs-detailermade'
            )}
            className={linkClasses}
          >
            ServiceLink vs Detail Connect vs DetailerMade
          </Link>
          .
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>How to Decide in Five Minutes</h2>
        <ol className="list-decimal list-outside space-y-2.5 text-gray-400 mb-5 ml-5 marker:text-gray-500">
          <li>Open both booking flows on your phone. Which one is calmer?</li>
          <li>
            Time how long it takes to list three services and open one day of
            availability.
          </li>
          <li>
            Ask whether your customers will finish booking without calling you.
          </li>
          <li>
            Check whether the dashboard still feels clear after a busy Saturday.
          </li>
        </ol>
        <p className={pClasses}>
          Most shops comparing ServiceLink vs Urable land on ServiceLink because
          it is simpler and still the full CRM. For a broader checklist, see the{' '}
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

      <GuideFaqAccordion
        items={GUIDE_FAQS.map(faq => ({
          question: faq.question,
          answer:
            faq.question === 'How do I try ServiceLink?' ? (
              <>
                {faq.answer}{' '}
                <Link href={blogGuideSignupPath(SLUG)} className={linkClasses}>
                  Create your free booking link
                </Link>
                .
              </>
            ) : (
              faq.answer
            ),
        }))}
      />

      <section className={sectionClasses}>
        <h2 className={h2Classes}>Verdict: ServiceLink is the pick</h2>
        <p className={pClasses}>
          Urable is a heavier field-service stack. ServiceLink is the detailing
          CRM: booking, automations, reviews, Team, and a $20 Pro plan.{' '}
          <strong className="text-gray-300">ServiceLink</strong> is the pick.
        </p>
        <p className={pClasses}>
          Put one booking link in your bio and let people book while you are on
          the job.{' '}
          <Link href={blogGuideSignupPath(SLUG)} className={linkClasses}>
            Start free with ServiceLink
          </Link>
          .
        </p>
      </section>
    </>
  );
}
