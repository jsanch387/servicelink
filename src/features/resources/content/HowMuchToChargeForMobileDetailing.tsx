import { ROUTES } from '@/constants/routes';
import { blogGuideSignupPath } from '@/features/marketing-attribution';
import { GuideFaqAccordion } from '@/features/resources/components/GuideFaqAccordion';
import { GuideProTip } from '@/features/resources/components/GuideCallouts';
import { getGuideBySlug } from '@/features/resources/data/guides';
import Link from 'next/link';

import {
  h2Classes,
  linkClasses,
  listClasses,
  pClasses,
  sectionClasses,
} from './guideContentStyles';

const SLUG = 'how-much-to-charge-for-mobile-detailing-2026';
const GUIDE_FAQS = getGuideBySlug(SLUG)?.faqs ?? [];

const priceHeaderClasses =
  'grid grid-cols-4 gap-2 sm:gap-3 px-3 sm:px-5 py-3 bg-white/[0.04] border-b border-white/10 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400';
const priceRowClasses =
  'grid grid-cols-4 gap-2 sm:gap-3 px-3 sm:px-5 py-3.5 border-b border-white/10 last:border-b-0 text-xs sm:text-sm text-gray-300';

export function HowMuchToChargeForMobileDetailingContent() {
  return (
    <>
      <p className={pClasses}>
        The most common question new detailers ask is{' '}
        <strong className="text-gray-300">
          how much to charge for mobile detailing
        </strong>
        . The second most common mistake is inventing a new number for every
        Tahoe in a text thread.
      </p>
      <p className={pClasses}>
        Publish packages by vehicle size, price the condition separately, and
        put those numbers on a booking page. This 2026 guide gives typical U.S.
        ranges, not a promise for your zip code. Your market, water, drive time,
        and finish quality still decide the final menu.
      </p>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>
          Price the Package, Not a Custom Guess Every Time
        </h2>
        <p className={pClasses}>
          Customers want a number they can tap. You want a number that covers
          chemicals, towels, fuel, and the 25 minutes you will sit in traffic. A
          public menu does both.
        </p>
        <ul className={listClasses}>
          <li>Base price by service + vehicle size (sedan / SUV / truck)</li>
          <li>Add-ons for pet hair, heavy soil, engine bay, headlights</li>
          <li>A condition surcharge when the car is neglected</li>
          <li>A deposit so the slot is real</li>
        </ul>
        <p className={pClasses}>
          If you are still quoting every job from scratch, read{' '}
          <Link
            href={ROUTES.RESOURCE_GUIDE(
              'how-to-start-a-mobile-detailing-business-2026'
            )}
            className={linkClasses}
          >
            how to start a mobile detailing business
          </Link>{' '}
          for the rest of the launch checklist—then come back here for the menu.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>Typical Mobile Detailing Prices in 2026</h2>
        <p className={pClasses}>
          These are common ranges for a solo mobile operator in a mid-cost U.S.
          market. Coastal cities and luxury suburbs sit higher. Small towns sit
          lower. If you are booked two weeks out on the cheap package, raise it.
        </p>

        <div className="mb-6 overflow-x-auto rounded-xl border border-white/10">
          <div className="min-w-[32rem]">
            <div className={priceHeaderClasses}>
              <span>Service</span>
              <span>Sedan</span>
              <span>SUV / crossover</span>
              <span>Truck / large</span>
            </div>
            <div className={priceRowClasses}>
              <span className="font-medium text-white">Exterior wash</span>
              <span>$60–$120</span>
              <span>$80–$150</span>
              <span>$90–$180</span>
            </div>
            <div className={`${priceRowClasses} bg-white/[0.02]`}>
              <span className="font-medium text-white">Interior detail</span>
              <span>$150–$260</span>
              <span>$180–$320</span>
              <span>$200–$380</span>
            </div>
            <div className={priceRowClasses}>
              <span className="font-medium text-white">Full detail</span>
              <span>$200–$380</span>
              <span>$260–$480</span>
              <span>$300–$560</span>
            </div>
            <div className={`${priceRowClasses} bg-white/[0.02]`}>
              <span className="font-medium text-white">Maintenance detail</span>
              <span>$140–$240</span>
              <span>$170–$290</span>
              <span>$190–$330</span>
            </div>
          </div>
        </div>

        <p className={pClasses}>
          A maintenance detail is a shorter visit for customers who already keep
          the car clean. It is how you fill weekdays without quoting a full
          restore every time.
        </p>

        <GuideProTip>
          Price toward the middle of your local Google results, not the bottom.
          Cheap work fills the calendar with jobs that do not cover drive time.
        </GuideProTip>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>Add-Ons and Condition Charges</h2>
        <p className={pClasses}>
          Do not hide extra work inside a “full detail.” Name it. Customers
          accept a surcharge they can see.
        </p>
        <ul className={listClasses}>
          <li>Pet hair: $40–$120 depending on how packed the fabric is</li>
          <li>Heavy soil / trash-out: $50–$150</li>
          <li>Engine bay: $40–$90</li>
          <li>Headlight restoration: $60–$130 a pair</li>
          <li>Ozone or odor treatment: $75–$200</li>
        </ul>
        <p className={pClasses}>
          If the interior is a two-person, four-hour job, say so before you
          confirm. A photo from the customer saves you from a $180 quote on a
          $400 car.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>
          Ceramic, Correction, and Other Premium Work
        </h2>
        <p className={pClasses}>
          Keep high-ticket work off the wash menu. Paint correction and ceramic
          coating need lighting, time, and a callback policy. Typical mobile
          ranges if you already know the work:
        </p>
        <ul className={listClasses}>
          <li>Single-step polish: often $300–$700 depending on size</li>
          <li>Multi-step correction: often $600–$1,500+</li>
          <li>
            Ceramic on a prepared sedan: often $600–$1,200 for a solid consumer
            coat
          </li>
        </ul>
        <p className={pClasses}>
          Require a larger deposit on these. They are the jobs that hurt when
          someone cancels after you blocked the day. See{' '}
          <Link
            href={ROUTES.RESOURCE_GUIDE(
              'stop-no-shows-deposits-mobile-detailing'
            )}
            className={linkClasses}
          >
            deposits and no-show policy
          </Link>
          .
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>Don’t Forget Drive Time and Water</h2>
        <p className={pClasses}>
          Mobile is not cheaper than a shop if you pretend the truck is free.
          Build these into the package or add a trip fee past a set radius:
        </p>
        <ul className={listClasses}>
          <li>Fuel and wear for every mile that is not billed</li>
          <li>Water you haul or the time to find a spigot</li>
          <li>Weather delays that turn a 90-minute job into two hours</li>
        </ul>
        <p className={pClasses}>
          A simple rule: if the drive is more than 25–30 minutes one way, add a
          trip fee or raise that ZIP. You are selling convenience. Charge for
          it.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>When to Raise Your Prices</h2>
        <p className={pClasses}>Raise the menu when:</p>
        <ul className={listClasses}>
          <li>You are booked 10–14 days out on the main package</li>
          <li>The cheap wash is crowding out full details</li>
          <li>Chemicals, fuel, or insurance just went up</li>
          <li>Your finish is clearly better than the $80 guy on Facebook</li>
        </ul>
        <p className={pClasses}>
          Grandfather a few loyal customers for one cycle if you want. Do not
          keep a secret “friends price” that becomes your real average ticket.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>Put the Prices Where People Book</h2>
        <p className={pClasses}>
          A PDF in your Instagram highlights still ends in DMs. Put sedan / SUV
          / truck prices on a public booking page so the customer picks a size
          and a time.
        </p>
        <p className={pClasses}>
          <Link href="/" className={linkClasses}>
            ServiceLink
          </Link>{' '}
          is built for that. Add packages, set vehicle pricing, require a
          deposit, and drop one link in your bio, Google profile, and texts.
          Most detailers can do this the same day.
        </p>
        <p className={pClasses}>
          Comparing software while you build the menu? Read{' '}
          <Link
            href={ROUTES.RESOURCE_GUIDE('servicelink-vs-urable-2026')}
            className={linkClasses}
          >
            ServiceLink vs Urable
          </Link>{' '}
          or the{' '}
          <Link
            href={ROUTES.RESOURCE_GUIDE(
              'servicelink-vs-detail-connect-vs-detailermade-2026'
            )}
            className={linkClasses}
          >
            Detail Connect / DetailerMade comparison
          </Link>
          .
        </p>
      </section>

      <GuideFaqAccordion
        items={GUIDE_FAQS.map(faq => ({
          question: faq.question,
          answer:
            faq.question === 'How do I show my detailing prices online?' ? (
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
        <h2 className={h2Classes}>Publish the Menu This Week</h2>
        <p className={pClasses}>
          You do not need a perfect market study. You need a menu you can
          defend, a surcharge for neglected cars, and a link that collects the
          booking while you are mid-job.
        </p>
        <p className={pClasses}>
          Start in the middle of the ranges above, watch which packages fill
          first, and raise the one that is always booked.{' '}
          <Link href={blogGuideSignupPath(SLUG)} className={linkClasses}>
            Put those prices on a ServiceLink page
          </Link>
          .
        </p>
      </section>
    </>
  );
}
