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

const SLUG = 'jobber-alternative-mobile-detailers';
const GUIDE_FAQS = getGuideBySlug(SLUG)?.faqs ?? [];

const orderedListClasses =
  'list-decimal list-outside space-y-2.5 text-gray-400 mb-5 ml-5 marker:text-gray-500';
const comparisonHeaderClasses =
  'grid grid-cols-3 gap-2 sm:gap-3 px-3 sm:px-5 py-3 bg-white/[0.04] border-b border-white/10 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400';
const comparisonRowClasses =
  'grid grid-cols-3 gap-2 sm:gap-3 px-3 sm:px-5 py-3.5 border-b border-white/10 last:border-b-0 text-xs sm:text-sm';

export function JobberAlternativeMobileDetailersContent() {
  return (
    <>
      <p className={pClasses}>
        Jobber is a solid field-service tool. It was not built for a one-truck
        detailer who books out of Instagram.
      </p>
      <p className={pClasses}>
        If you are still answering “you free Saturday?” in DMs, then chasing a
        Venmo, Jobber is usually more software than you need and more money than
        you want. Here is the simpler path—a{' '}
        <strong className="text-gray-300">
          Jobber alternative for mobile detailers
        </strong>{' '}
        built around one booking link.
      </p>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>What mobile detailers actually need</h2>
        <p className={pClasses}>
          You do not need dispatch for a 12-person crew. You need four things:
        </p>
        <ol className={orderedListClasses}>
          <li>A link you can drop in your Instagram bio</li>
          <li>A service menu with sedan / SUV / truck prices</li>
          <li>
            Deposits so no-shows stop eating your Saturday (Pro on ServiceLink)
          </li>
          <li>
            A list of who booked, with their phone number, so you can rebook
            them later
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
        <h2 className={h2Classes}>Jobber vs a detailing booking link</h2>
        <p className={pClasses}>
          <strong className="text-gray-300">Jobber</strong> is built for
          plumbers, cleaners, and lawn guys. Scheduling and invoicing are
          strong. For a solo mobile detailer it is usually $49 and up, plus
          add-ons if you want the extras people actually use. Customers often
          still have to create an account. There is no “one link in the bio”
          feel.
        </p>
        <p className={pClasses}>
          <Link href="/" className={linkClasses}>
            ServiceLink
          </Link>{' '}
          is a booking app for mobile detailers. Customers open
          myservicelink.app/yourname, pick a service, pick a time, and book. No
          app download for them. You run the day from the web or your phone
          (iOS/Android). Free for the first 5 online bookings, then Pro is
          $20/month or $200/year.
        </p>

        <div className="mb-6 overflow-x-auto rounded-xl border border-white/10">
          <div className="min-w-[28rem]">
            <div className={comparisonHeaderClasses}>
              <span>Category</span>
              <span>Jobber</span>
              <span className="text-white">ServiceLink</span>
            </div>
            <div className={comparisonRowClasses}>
              <span className="font-medium text-gray-300">Built for</span>
              <span className="text-gray-400">Field service teams</span>
              <span className="text-gray-200">Mobile detailers</span>
            </div>
            <div className={`${comparisonRowClasses} bg-white/[0.02]`}>
              <span className="font-medium text-gray-300">
                Customer books from
              </span>
              <span className="text-gray-400">Client hub / requests</span>
              <span className="text-gray-200">One bio link</span>
            </div>
            <div className={comparisonRowClasses}>
              <span className="font-medium text-gray-300">Deposits</span>
              <span className="text-gray-400">Yes, on higher plans</span>
              <span className="text-gray-200">Yes, on Pro</span>
            </div>
            <div className={`${comparisonRowClasses} bg-white/[0.02]`}>
              <span className="font-medium text-gray-300">
                Tap to Pay on iPhone
              </span>
              <span className="text-gray-400">No</span>
              <span className="text-gray-200">Yes (Pro)</span>
            </div>
            <div className={comparisonRowClasses}>
              <span className="font-medium text-gray-300">Starting price</span>
              <span className="text-gray-400">About $49/mo</span>
              <span className="text-gray-200">Free, then $20/mo</span>
            </div>
            <div className={`${comparisonRowClasses} bg-white/[0.02]`}>
              <span className="font-medium text-gray-300">
                Sedan vs SUV pricing
              </span>
              <span className="text-gray-400">Manual workarounds</span>
              <span className="text-gray-200">Built in</span>
            </div>
          </div>
        </div>
        <GuideProTip>
          Deposits and Tap to Pay are Pro—not Free. Start on the free booking
          link, then turn those on when you upgrade.
        </GuideProTip>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>When to stay on Jobber</h2>
        <p className={pClasses}>
          Stay if you have a crew, need route dispatch, or already live in
          Jobber for invoicing and do not want to move. Switching tools
          mid-season is a real cost.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>When to switch</h2>
        <p className={pClasses}>
          Switch if you are solo or a two-person shop, most leads come from
          Instagram or Facebook, and you are tired of quoting the same packages
          in DMs. If your “CRM” is a message thread, you do not need Jobber. You
          need a link. For a broader checklist, see the{' '}
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
              faq.question === 'What does it cost?' ? (
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
          You detail.{' '}
          <Link href={blogGuideSignupPath(SLUG)} className={linkClasses}>
            Start free
          </Link>
          .
        </p>
      </section>
    </>
  );
}
