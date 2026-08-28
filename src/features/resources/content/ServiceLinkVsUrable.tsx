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

const SLUG = 'servicelink-vs-urable-2026';
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
        <strong className="text-gray-300">ServiceLink vs Urable</strong>, you
        are probably choosing between a lean booking app and a heavier field
        service platform. Both can take jobs. The difference is how much
        software you have to manage between those jobs.
      </p>
      <p className={pClasses}>
        Urable is built like a full operations suite—lots of modules, lots of
        screens. ServiceLink is built for mobile detailers who want a clean
        booking link, a simple calendar, and a dashboard that stays organized.
        This guide is for owner-operators who want less bloat and a faster
        day-to-day.
      </p>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>
          The Real Difference: Lean Booking vs Heavy Ops Software
        </h2>
        <p className={pClasses}>
          Urable sits in the “field service CRM” category. Those products often
          include routing, estimates, invoicing, inventory, and team tools in
          one place. That can help a larger shop. It can also mean more setup,
          more menus, and a UI that feels busy when you only needed a customer
          to book a Saturday interior.
        </p>
        <p className={pClasses}>
          ServiceLink starts from the other end. Customers open your link, pick
          a package, pick a time, and pay a deposit if you require one. You
          manage services, availability, and today’s jobs from a phone-sized
          dashboard. Less software between you and the driveway.
        </p>
        <ul className={listClasses}>
          <li>One shareable booking page for Instagram, Google, and texts</li>
          <li>Sedan / SUV / truck pricing on each service</li>
          <li>Availability you control so only open slots show</li>
          <li>Deposits so no-shows stop eating fuel and time</li>
          <li>A UI you can run between jobs—not a cluttered ops console</li>
        </ul>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>ServiceLink vs Urable (2026 Snapshot)</h2>
        <p className={pClasses}>
          Plans and feature lists change. What stays true is how each product
          feels for a solo or small mobile detailing business.
        </p>

        <div className="mb-6 overflow-x-auto rounded-xl border border-white/10">
          <div className="min-w-[28rem]">
            <div className={comparisonHeaderClasses}>
              <span>Category</span>
              <span className="text-white">ServiceLink</span>
              <span>Urable</span>
            </div>
            <div className={comparisonRowClasses}>
              <span className="font-medium text-gray-300">Feel</span>
              <span className="text-gray-200">
                Lean, clean, built for daily use
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
              <span className="font-medium text-gray-300">Best for</span>
              <span className="text-gray-200">
                Solo detailers and small teams
              </span>
              <span className="text-gray-400">
                Shops that want a full ops stack
              </span>
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
              <span className="font-medium text-gray-300">Free to start</span>
              <span className="text-gray-200">Yes—share a booking link</span>
              <span className="text-gray-400">Varies by plan</span>
            </div>
          </div>
        </div>

        <GuideProTip>
          If you open the app ten times a day, the lighter product usually wins.
          Feature lists look impressive. Clutter is what you feel on a job.
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
          You do not need every field-service module to run a mobile detailing
          route. ServiceLink keeps the path short: services, schedule, bookings,
          payments. That is easier to learn and harder to lose track of when you
          are already wet and behind.
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
        <h2 className={h2Classes}>When Urable Might Still Fit</h2>
        <p className={pClasses}>
          Urable can make sense if you want a wide field-service toolkit and you
          have time to configure it—routing, deeper invoicing, or a larger crew
          that lives in one ops platform. Some shops prefer that density.
        </p>
        <p className={pClasses}>
          If you are a mobile detailer (or a small team) and your priority is{' '}
          <em className="text-gray-300 not-italic">
            look professional, book faster, stay organized
          </em>
          , ServiceLink is usually the better everyday app. For a three-way look
          at other detailing tools, read{' '}
          <Link
            href={ROUTES.RESOURCE_GUIDE(
              'servicelink-vs-detail-connect-vs-detailermade-2026'
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
          Most detailers comparing ServiceLink vs Urable land on ServiceLink
          because it stays lean. For a broader checklist, see the{' '}
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
        <h2 className={h2Classes}>Final Verdict</h2>
        <p className={pClasses}>
          Urable is a real option if you want a heavier field-service stack. For
          mobile detailers who want something leaner, cleaner, and easier to run
          from a phone, <strong className="text-gray-300">ServiceLink</strong>{' '}
          is the better fit in 2026.
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
