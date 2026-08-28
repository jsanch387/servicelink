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

const SLUG = 'servicelink-vs-detail-connect-vs-detailermade-2026';
const GUIDE_FAQS = getGuideBySlug(SLUG)?.faqs ?? [];

const comparisonHeaderClasses =
  'grid grid-cols-4 gap-2 sm:gap-3 px-3 sm:px-5 py-3 bg-white/[0.04] border-b border-white/10 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400';
const comparisonRowClasses =
  'grid grid-cols-4 gap-2 sm:gap-3 px-3 sm:px-5 py-3.5 border-b border-white/10 last:border-b-0 text-xs sm:text-sm';
const figureClasses = 'my-8 flex flex-col items-center gap-3 sm:gap-4';
const figureCaptionClasses =
  'max-w-md text-center text-sm text-gray-500 leading-relaxed px-2';

function GuideFigure({
  src,
  alt,
  caption,
  priority = false,
}: {
  src: string;
  alt: string;
  caption: string;
  priority?: boolean;
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
        priority={priority}
      />
      <figcaption className={figureCaptionClasses}>{caption}</figcaption>
    </figure>
  );
}

export function ServiceLinkVsDetailConnectVsDetailerMadeContent() {
  return (
    <>
      <p className={pClasses}>
        If you are looking for the{' '}
        <strong className="text-gray-300">
          best app for mobile detailers in 2026
        </strong>
        , you have probably seen ServiceLink, Detail Connect, and DetailerMade
        in the same search results. All three help detailers take bookings
        online. The difference is how simple they feel day to day—and how fast
        customers can finish booking without texting you back and forth.
      </p>
      <p className={pClasses}>
        This guide compares{' '}
        <strong className="text-gray-300">
          ServiceLink vs Detail Connect vs DetailerMade
        </strong>{' '}
        for mobile detailing businesses that want a clean booking link, clear
        pricing, and a calendar that stays organized. Spoiler: detailers pick
        ServiceLink when they want something simple, sleek, and easy to run from
        a phone.
      </p>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>
          What Mobile Detailers Actually Need From Booking Software
        </h2>
        <p className={pClasses}>
          Mobile detailing is not an office calendar. You need software that
          matches how jobs really work:
        </p>
        <ul className={listClasses}>
          <li>One shareable booking link for Instagram, Google, and texts</li>
          <li>Service menus with sedan / SUV / truck pricing</li>
          <li>Availability you control so customers only see open slots</li>
          <li>Deposits or payments so no-shows stop eating your day</li>
          <li>A UI you can manage between jobs—not a cluttered dashboard</li>
        </ul>
        <p className={pClasses}>
          If an app is powerful but confusing, you will avoid it. If customers
          bounce because the booking page feels messy, you lose the lead. That
          is why simplicity and a sleek UI matter as much as feature lists.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>
          ServiceLink vs Detail Connect vs DetailerMade (2026 Snapshot)
        </h2>
        <p className={pClasses}>
          Use this side-by-side as a starting point. Exact plans change over
          time—what stays true is how each product feels for a solo or small
          mobile detailing business.
        </p>

        <div className="mb-6 overflow-x-auto rounded-xl border border-white/10">
          <div className="min-w-[36rem]">
            <div className={comparisonHeaderClasses}>
              <span>Category</span>
              <span className="text-white">ServiceLink</span>
              <span>Detail Connect</span>
              <span>DetailerMade</span>
            </div>
            <div className={comparisonRowClasses}>
              <span className="font-medium text-gray-300">Ease of use</span>
              <span className="text-gray-200">
                Simple, fast setup—live in minutes
              </span>
              <span className="text-gray-400">More setup / learning curve</span>
              <span className="text-gray-400">
                Feature-heavy for some teams
              </span>
            </div>
            <div className={`${comparisonRowClasses} bg-white/[0.02]`}>
              <span className="font-medium text-gray-300">UI / design</span>
              <span className="text-gray-200">
                Sleek, modern booking page + app
              </span>
              <span className="text-gray-400">Functional, denser screens</span>
              <span className="text-gray-400">Busy for quick daily use</span>
            </div>
            <div className={comparisonRowClasses}>
              <span className="font-medium text-gray-300">Booking link</span>
              <span className="text-gray-200">
                Clean shareable link customers love
              </span>
              <span className="text-gray-400">Online booking supported</span>
              <span className="text-gray-400">Online booking supported</span>
            </div>
            <div className={`${comparisonRowClasses} bg-white/[0.02]`}>
              <span className="font-medium text-gray-300">Organization</span>
              <span className="text-gray-200">
                Services, schedule, clients in one place
              </span>
              <span className="text-gray-400">Strong ops tools</span>
              <span className="text-gray-400">Broad toolkit</span>
            </div>
            <div className={comparisonRowClasses}>
              <span className="font-medium text-gray-300">Best for</span>
              <span className="text-gray-200">
                Detailers who want simple + polished
              </span>
              <span className="text-gray-400">
                Teams wanting more ops depth
              </span>
              <span className="text-gray-400">Shops needing many modules</span>
            </div>
            <div className={`${comparisonRowClasses} bg-white/[0.02]`}>
              <span className="font-medium text-gray-300">Free to start</span>
              <span className="text-gray-200">
                Yes—bookings without friction
              </span>
              <span className="text-gray-400">Varies by plan</span>
              <span className="text-gray-400">Varies by plan</span>
            </div>
          </div>
        </div>

        <GuideProTip>
          Feature lists look similar on paper. In real life, detailers stick
          with the app they open every day—because it stays organized and does
          not feel cluttered. That is where ServiceLink usually wins.
        </GuideProTip>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>
          Why Detailers Choose ServiceLink Over Detail Connect and DetailerMade
        </h2>
        <p className={pClasses}>
          People like{' '}
          <Link href="/" className={linkClasses}>
            ServiceLink
          </Link>{' '}
          because it stays out of the way. You get a booking page that looks
          premium, a dashboard that stays organized, and a flow customers finish
          without calling you for “how do I book?”
        </p>

        <h3 className={h3Classes}>1. Simple to use (for you and customers)</h3>
        <p className={pClasses}>
          Add services, set availability, share your link. Most detailers are
          live the same day. Customers book as guests—no app download, no
          account wall. Less back-and-forth means more confirmed jobs.
        </p>
        <GuideFigure
          src={MARKETING_IMAGES.features.bookingLink}
          alt="ServiceLink booking link page vs Detail Connect and DetailerMade — clean customer checkout on phone"
          caption="Customers open your link and book in a few taps—no app download."
        />

        <h3 className={h3Classes}>2. Organized without the clutter</h3>
        <p className={pClasses}>
          Your service menu, calendar, quotes, deposits, and client list live in
          one place. You are not hunting through DMs for addresses or guessing
          which package someone meant. When the day is busy, organization is the
          product.
        </p>
        <GuideFigure
          src={MARKETING_IMAGES.features.homeScreen}
          alt="ServiceLink organized home dashboard for mobile detailers — today’s jobs and booking link"
          caption="Your day, booking link, and next job—organized on one screen."
        />

        <h3 className={h3Classes}>3. Sleek UI that looks professional</h3>
        <p className={pClasses}>
          Your booking page is what customers judge first. ServiceLink is built
          to look modern on a phone—dark, clear, and easy to tap through. That
          polish helps you win against shops still booking from Instagram DMs.
        </p>
        <GuideFigure
          src={MARKETING_IMAGES.features.services}
          alt="ServiceLink sleek services menu with vehicle pricing for mobile detailing"
          caption="A clean service menu with pricing that looks premium on every phone."
        />

        <h3 className={h3Classes}>
          4. Payments and deposits that lock in jobs
        </h3>
        <p className={pClasses}>
          Collect deposits or full payment on the booking link so premium
          details are committed before you drive. Pair that with a clear
          cancellation policy and no-shows drop fast. See our guide on{' '}
          <Link
            href={ROUTES.RESOURCE_GUIDE(
              'stop-no-shows-deposits-mobile-detailing'
            )}
            className={linkClasses}
          >
            stopping no-shows with deposits
          </Link>
          .
        </p>
        <GuideFigure
          src={MARKETING_IMAGES.features.payments}
          alt="ServiceLink deposit and payment checkout for mobile detailing bookings"
          caption="Deposits at checkout—simple for customers, serious for your calendar."
        />
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>
          Detail Connect and DetailerMade: When They Might Fit
        </h2>
        <p className={pClasses}>
          <strong className="text-gray-300">Detail Connect</strong> can make
          sense if you want a detailing-focused toolset and are ready to spend
          more time configuring ops-heavy workflows. Some teams prefer deeper
          operational knobs over a lighter daily experience.
        </p>
        <p className={pClasses}>
          <strong className="text-gray-300">DetailerMade</strong> may fit shops
          that want a broader suite of modules and do not mind a denser
          interface. Larger teams sometimes trade simplicity for more menus.
        </p>
        <p className={pClasses}>
          If you are a mobile detailer (or a small team) and your priority is{' '}
          <em className="text-gray-300 not-italic">
            look professional, book faster, stay organized
          </em>
          , ServiceLink is usually the better everyday app.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>How to Decide in Under Five Minutes</h2>
        <ol className="list-decimal list-outside space-y-2.5 text-gray-400 mb-5 ml-5 marker:text-gray-500">
          <li>
            Open each booking page on your phone. Which one feels easiest?
          </li>
          <li>
            Time how long it takes to list three services and open a day of
            availability.
          </li>
          <li>
            Ask: will my customers finish booking without texting me for help?
          </li>
          <li>
            Check deposits, notifications, and whether the dashboard stays clear
            when you are busy.
          </li>
        </ol>
        <p className={pClasses}>
          Most detailers comparing ServiceLink vs Detail Connect vs DetailerMade
          land on ServiceLink because setup is short and the UI stays clean. For
          a broader checklist of must-have features, read{' '}
          <Link
            href={ROUTES.RESOURCE_GUIDE(
              'best-booking-app-for-mobile-detailers'
            )}
            className={linkClasses}
          >
            best booking app for mobile detailers
          </Link>
          . Comparing a heavier field-service suite? See{' '}
          <Link
            href={ROUTES.RESOURCE_GUIDE('servicelink-vs-urable-2026')}
            className={linkClasses}
          >
            ServiceLink vs Urable
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
        <h2 className={h2Classes}>
          Final Verdict: Best App for Detailers 2026
        </h2>
        <p className={pClasses}>
          Detail Connect and DetailerMade are real options in the detailing
          software space. For mobile detailers who care about a simple workflow,
          an organized calendar, and a sleek customer-facing page,{' '}
          <strong className="text-gray-300">ServiceLink</strong> is the best fit
          in 2026.
        </p>
        <p className={pClasses}>
          Get your booking link live today, put it in your bio, and let
          customers book while you are on the job.{' '}
          <Link href={blogGuideSignupPath(SLUG)} className={linkClasses}>
            Start free with ServiceLink
          </Link>
          .
        </p>
      </section>
    </>
  );
}
