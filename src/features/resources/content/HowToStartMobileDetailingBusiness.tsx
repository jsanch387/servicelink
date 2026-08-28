import { ROUTES } from '@/constants/routes';
import { blogGuideSignupPath } from '@/features/marketing-attribution';
import { GuideFaqAccordion } from '@/features/resources/components/GuideFaqAccordion';
import { GuideProTip } from '@/features/resources/components/GuideCallouts';
import { getGuideBySlug } from '@/features/resources/data/guides';
import Link from 'next/link';

import {
  h2Classes,
  h3Classes,
  linkClasses,
  listClasses,
  pClasses,
  sectionClasses,
} from './guideContentStyles';

const SLUG = 'how-to-start-a-mobile-detailing-business-2026';
const GUIDE_FAQS = getGuideBySlug(SLUG)?.faqs ?? [];

const comparisonRowClasses =
  'grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-1 sm:gap-4 py-4 border-b border-white/10 last:border-b-0';

export function HowToStartMobileDetailingBusinessContent() {
  return (
    <>
      <p className={pClasses}>
        You do not need a shop, a custom van, or a huge following to{' '}
        <strong className="text-gray-300">
          start a mobile detailing business
        </strong>
        . You need a lean kit, insurance, a simple service menu, and a way for
        people to book you without a 20-message text thread.
      </p>
      <p className={pClasses}>
        This 2026 playbook is for solo operators. It covers startup costs,
        equipment, licenses, pricing, and how to get your first clients—then
        turn those jobs into a calendar you can actually run.
      </p>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>
          What a Mobile Detailing Business Actually Is
        </h2>
        <p className={pClasses}>
          A mobile detailing business comes to the customer—home, office, or
          lot—instead of asking them to drop the car at a shop. That is the
          whole offer: convenience plus a better result than a drive-through
          wash.
        </p>
        <p className={pClasses}>Most new operators sell a short menu:</p>
        <ul className={listClasses}>
          <li>Exterior wash and dry</li>
          <li>Interior clean or full interior detail</li>
          <li>Full detail (inside and out)</li>
          <li>Add-ons like pet hair, engine bay, or headlight restoration</li>
        </ul>
        <p className={pClasses}>
          Save ceramic coating and multi-step paint correction until you have
          reps, the right lighting, and customers who already trust you. Those
          jobs pay more, but they also take more time and create more callbacks
          if you rush them.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>
          Is a Mobile Detailing Business Profitable in 2026?
        </h2>
        <p className={pClasses}>
          It can be—especially compared with a leased bay. You skip shop rent,
          but you pay for drive time, fuel, water, and weather delays. The
          operators who stay profitable treat those as real costs, not
          afterthoughts.
        </p>
        <p className={pClasses}>A realistic solo picture looks like this:</p>
        <ul className={listClasses}>
          <li>
            Average ticket often lands in the $150–$300 range once you sell full
            details instead of $50 washes
          </li>
          <li>
            Two to four completed jobs on a good day is a full calendar, not
            eight
          </li>
          <li>
            Repeat customers and simple maintenance plans beat chasing a new
            lead for every Saturday slot
          </li>
        </ul>
        <p className={pClasses}>
          The fastest way to stay unprofitable is underpricing “to get
          experience,” then filling the week with low-ticket work that does not
          cover fuel. Price the package, not your nerves.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>
          How Much It Costs to Start a Mobile Detailing Business
        </h2>
        <p className={pClasses}>
          You can launch lean. A custom van wrap and a $20,000 buildout are
          optional later—not the price of admission.
        </p>

        <div className="rounded-xl border border-white/10 overflow-hidden mb-6">
          <div
            className={`${comparisonRowClasses} bg-white/[0.03] px-4 sm:px-5`}
          >
            <p className="text-sm font-semibold text-white">Starter</p>
            <p className="text-sm text-gray-400 leading-relaxed">
              $2,500–$4,500. Used pressure washer, shop vac or basic extractor,
              chemicals, towels, insurance, and simple branding.
            </p>
          </div>
          <div className={`${comparisonRowClasses} px-4 sm:px-5`}>
            <p className="text-sm font-semibold text-white">Solid kit</p>
            <p className="text-sm text-gray-400 leading-relaxed">
              $5,000–$10,000. Better extractor, foam cannon, polisher, water
              tank or tote, and cleaner storage so jobs go faster.
            </p>
          </div>
          <div className={`${comparisonRowClasses} px-4 sm:px-5`}>
            <p className="text-sm font-semibold text-white">Pro setup</p>
            <p className="text-sm text-gray-400 leading-relaxed">
              $12,000–$25,000+. Van organization, heated water, RO/DI, and extra
              machines. Buy this after the calendar is full—not to feel
              official.
            </p>
          </div>
        </div>

        <p className={pClasses}>
          Budget for insurance and a buffer for your first slow month. Those two
          line items stall more new detailers than a missing dual-action
          polisher.
        </p>
        <GuideProTip>
          Spend first on things that let you take paid jobs safely: insurance, a
          reliable water plan, and a booking page with prices. Machines are
          easier to upgrade once money is coming in.
        </GuideProTip>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>
          Mobile Detailing Equipment List (What You Need vs. What to Skip)
        </h2>
        <p className={pClasses}>
          Buy the smallest kit that can deliver a clean, dry, well-vacuumed car.
          Everything else is a later upgrade.
        </p>

        <h3 className={h3Classes}>Need on day one</h3>
        <ul className={listClasses}>
          <li>Pressure washer (electric is fine if you have power on site)</li>
          <li>
            Hose, splitters, and a water plan—or a tank if driveways will not
            share a spigot
          </li>
          <li>Shop vac or interior extractor</li>
          <li>Two buckets, grit guards, wash mitt, and drying towels</li>
          <li>Foam cannon, wheel brushes, and a dedicated wheel bucket</li>
          <li>
            APC, car soap, glass cleaner, interior dressing, and a tire product
          </li>
          <li>Nitrile gloves, a folding stool, and a phone mount or speaker</li>
        </ul>

        <h3 className={h3Classes}>Wait until you are booked</h3>
        <ul className={listClasses}>
          <li>Dual-action polisher and compounds</li>
          <li>Ceramic coating kits and infrared lights</li>
          <li>Steam cleaner and ozone machine</li>
          <li>Custom van shelving, generators, and heated tanks</li>
        </ul>
        <p className={pClasses}>
          If a tool only helps on 1 out of 10 jobs, rent it or add it after
          customers are already paying you.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>Licenses, Insurance, and Legal Setup</h2>
        <p className={pClasses}>
          Rules change by city, but most mobile detailers work through the same
          checklist. Do this before you take money from strangers.
        </p>
        <ul className={listClasses}>
          <li>
            <strong className="text-gray-300">LLC.</strong> Keeps business
            liability off your personal accounts in most cases. File in your
            state and keep the paperwork.
          </li>
          <li>
            <strong className="text-gray-300">EIN and business bank.</strong>{' '}
            Separate money from day one. You will need this for payments and
            taxes.
          </li>
          <li>
            <strong className="text-gray-300">General liability.</strong> Covers
            damage claims on a customer’s property. Ask about on-hook / care,
            custody, and control language for vehicles you are working on.
          </li>
          <li>
            <strong className="text-gray-300">Commercial auto.</strong> If the
            vehicle is used for the business, personal auto policies often will
            not cover a claim. Confirm this with your agent—do not guess.
          </li>
          <li>
            <strong className="text-gray-300">Local license or permit.</strong>{' '}
            Some cities want a business license, mobile vendor permit, or
            wastewater rules for what you put down a drain.
          </li>
        </ul>
        <p className={pClasses}>
          Call your city clerk and a local insurance agent. A 20-minute
          conversation is cheaper than finding out you were uninsured after a
          scratched bumper.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>
          How to Price Mobile Detailing When You Are New
        </h2>
        <p className={pClasses}>
          Do not invent a custom number for every sedan in a driveway. Publish
          packages by vehicle size, then add for condition.
        </p>
        <p className={pClasses}>
          A simple 2026 starter menu many solo operators can defend:
        </p>
        <ul className={listClasses}>
          <li>Exterior wash: $60–$120 sedan, more for SUVs and trucks</li>
          <li>Interior detail: $150–$260 sedan</li>
          <li>Full detail: $200–$380 sedan, $260–$480 SUV / truck</li>
          <li>
            Add-ons: pet hair, heavy soil, and long drives priced as their own
            line
          </li>
        </ul>
        <p className={pClasses}>
          Price toward the middle of your market, not the bottom. If you are
          booked two weeks out on the cheap package, raise it. If nobody books
          the full detail, the photos and the package name are usually the
          problem—not the fact that you charged a fair rate.
        </p>
        <p className={pClasses}>
          Put those prices on a public page so customers stop asking “how much
          for my Tahoe?” before they commit. See the full 2026 ranges in{' '}
          <Link
            href={ROUTES.RESOURCE_GUIDE(
              'how-much-to-charge-for-mobile-detailing-2026'
            )}
            className={linkClasses}
          >
            how much to charge for mobile detailing
          </Link>
          . A booking app lets you show sedan / SUV / truck pricing on each
          service.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>
          Get a Booking Page Live Before You Buy More Gear
        </h2>
        <p className={pClasses}>
          The operators who look “booked” in month one are not better at DMs.
          They made it easy to pick a service, see a time, and pay a deposit
          while they were already on a job.
        </p>
        <p className={pClasses}>
          <Link href="/" className={linkClasses}>
            ServiceLink
          </Link>{' '}
          is built for that flow. You get a shareable booking link, a service
          menu, availability you control, and optional deposits—without asking
          customers to download an app.
        </p>
        <ul className={listClasses}>
          <li>Add your packages and vehicle-based prices</li>
          <li>Set the days and hours you actually work</li>
          <li>
            Require a deposit so empty driveways stop eating your afternoon
          </li>
          <li>Drop one link in Instagram, Google, and texts</li>
        </ul>
        <p className={pClasses}>
          Most detailers can do this the same day they finish the legal
          checklist.{' '}
          <Link href={blogGuideSignupPath(SLUG)} className={linkClasses}>
            Create your free booking link
          </Link>
          . If no-shows are already a problem, read{' '}
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
        <h2 className={h2Classes}>How to Get Your First 10 Customers</h2>
        <p className={pClasses}>
          You do not need 10,000 followers. You need ten people nearby who can
          leave a review and tell a neighbor.
        </p>

        <h3 className={h3Classes}>1. Trade early jobs for proof</h3>
        <p className={pClasses}>
          Detail cars for friends, family, and neighbors at a tight rate or in
          exchange for a Google review with photos. Five real reviews with
          before/after pictures will outperform a logo you spent a week
          designing.
        </p>

        <h3 className={h3Classes}>
          2. Set up Google as a service-area business
        </h3>
        <p className={pClasses}>
          Create a Google Business Profile, mark it as serving an area (not a
          storefront you do not have), add photos, and put your booking link in
          the profile. Local search is how a lot of detailing customers still
          find someone.
        </p>

        <h3 className={h3Classes}>
          3. Be visible on the street you already work
        </h3>
        <p className={pClasses}>
          A clean car, a simple door hanger on nearby driveways, and a polite
          Nextdoor post after a job still work. People book the detailer they
          just saw on their block.
        </p>

        <h3 className={h3Classes}>
          4. Post local videos, then point to one link
        </h3>
        <p className={pClasses}>
          Short before/after clips in your city beat generic “day in the life”
          content. Our guide on{' '}
          <Link
            href={ROUTES.RESOURCE_GUIDE(
              'how-mobile-detailers-get-clients-from-instagram-2026'
            )}
            className={linkClasses}
          >
            getting clients from Instagram
          </Link>{' '}
          covers the video ideas. The important part: one booking link in the
          bio so viewers do not have to DM you.
        </p>
        <GuideProTip>
          Ask for the review before you leave the driveway, while the car still
          looks new. Waiting until “later tonight” is how most review requests
          disappear.
        </GuideProTip>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>Your First 90 Days</h2>
        <p className={pClasses}>
          Treat the first quarter like a system, not a vibe.
        </p>
        <ul className={listClasses}>
          <li>
            <strong className="text-gray-300">Days 1–14.</strong> LLC,
            insurance, kit, Google profile, service menu, booking link.
          </li>
          <li>
            <strong className="text-gray-300">Days 15–45.</strong> Ten completed
            jobs, ten review asks, deposits on the calendar, no custom quotes
            unless the car is a wreck.
          </li>
          <li>
            <strong className="text-gray-300">Days 46–90.</strong> Raise prices
            if you are booked, drop the cheapest package if it wrecks your day,
            and start offering a simple rebook or maintenance plan to people who
            already like your work.
          </li>
        </ul>
        <p className={pClasses}>
          If you want a side-by-side on booking software after you are live,
          read{' '}
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
        <h2 className={h2Classes}>Mistakes That Stall New Mobile Detailers</h2>
        <ul className={listClasses}>
          <li>Buying a van buildout before you have repeat customers</li>
          <li>Pricing by the hour in your head, then forgetting drive time</li>
          <li>Running the whole business through Instagram DMs</li>
          <li>Skipping deposits and hoping people show up</li>
          <li>Saying yes to every add-on without adding time or money</li>
          <li>
            Waiting for a perfect logo instead of taking the first ten jobs
          </li>
        </ul>
        <p className={pClasses}>
          A mobile detailing business rewards people who stay organized. The
          work is the easy part once the calendar, prices, and policies are
          written down.
        </p>
      </section>

      {GUIDE_FAQS.length ? (
        <GuideFaqAccordion
          items={GUIDE_FAQS.map(faq => ({
            question: faq.question,
            answer: faq.answer,
          }))}
        />
      ) : null}

      <section className={sectionClasses}>
        <h2 className={h2Classes}>Start This Week</h2>
        <p className={pClasses}>
          You do not need a perfect brand to start a mobile detailing business
          in 2026. You need a kit that works, coverage if something goes wrong,
          prices you can say out loud, and a link customers can book while you
          are mid-job.
        </p>
        <p className={pClasses}>
          Get the legal basics done, put your packages on a page, and share that
          link everywhere people already find you.{' '}
          <Link href={blogGuideSignupPath(SLUG)} className={linkClasses}>
            Get your free ServiceLink booking page
          </Link>{' '}
          and take the first booking before you buy another machine.
        </p>
      </section>
    </>
  );
}
