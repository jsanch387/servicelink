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
  listClasses,
  orderedListClasses,
  pClasses,
  sectionClasses,
} from './guideContentStyles';

const SLUG = 'mobile-tech-rx-alternative';
const GUIDE_FAQS = getGuideBySlug(SLUG)?.faqs ?? [];

const snapshotHeaderClasses = `${comparisonHeaderClasses} grid-cols-3`;
const snapshotRowClasses = `${comparisonRowClasses} grid-cols-3`;

export function MobileTechRxAlternativeContent() {
  return (
    <>
      <p className={pClasses}>
        If you searched{' '}
        <strong className="text-gray-300">Mobile Tech RX alternative</strong> or{' '}
        <strong className="text-gray-300">ServiceLink vs Mobile Tech RX</strong>
        , you are usually a mobile detailer paying recon-shop prices for a
        calendar—or you are comparing two tools that share the word “detail” and
        almost nothing else.
      </p>
      <p className={pClasses}>
        ServiceLink is the better app for solo mobile detailers. You get a
        public booking page, a CRM that fills in from every job, SMS reminders,
        review requests when you tap complete, deposits on Pro, and a UI you can
        run from a cup holder. Free for the first 5 appointments. Pro is
        $20/month or $200/year.
      </p>
      <p className={pClasses}>
        MTX prices and feature lists are from{' '}
        <a href="https://www.mobiletechrx.com/plans/" className={linkClasses}>
          mobiletechrx.com/plans
        </a>{' '}
        and their scheduling FAQ, as of November 2026.
      </p>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>
          Why solo mobile detailers pick ServiceLink
        </h2>
        <p className={pClasses}>
          A one-truck interior/exterior week is not a hail pipeline. You need a
          link in the bio, sedan / SUV / truck prices, a deposit so the slot is
          real, and a client list you can text next month. ServiceLink is built
          for that week.
        </p>
        <ol className={orderedListClasses}>
          <li>
            A public booking page at myservicelink.app/yourname. Guests pick a
            package and a time. No customer app.
          </li>
          <li>
            A CRM behind that page: name, phone, email, vehicle, visit history,
            notes, CSV import when you switch.
          </li>
          <li>
            Automations: confirmation SMS/email, a day-before reminder,
            on-the-way and job-complete texts, a review request after you mark
            the job done.
          </li>
          <li>
            Google reviews on the same booking page when you connect Google
            Business Profile.
          </li>
          <li>
            Deposits, Tap to Pay, quotes, invoices, receipts, and expense
            tracking on Pro—plus native iOS and Android apps.
          </li>
        </ol>
        <p className={pClasses}>
          That checklist is the same one in our{' '}
          <Link
            href={ROUTES.RESOURCE_GUIDE(
              'best-booking-app-for-mobile-detailers'
            )}
            className={linkClasses}
          >
            best booking app for mobile detailers
          </Link>{' '}
          guide and the{' '}
          <Link
            href={ROUTES.RESOURCE_GUIDE('best-crm-for-mobile-detailers')}
            className={linkClasses}
          >
            best CRM for mobile detailers
          </Link>{' '}
          roundup. MTX can store customers and cars. ServiceLink is the booking
          page at the other end of a Reel.
        </p>
        <p className={pClasses}>
          <Link href={blogGuideSignupPath(SLUG)} className={linkClasses}>
            Try ServiceLink free — first 5 appointments
          </Link>
          .
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>
          What a ServiceLink week actually looks like
        </h2>
        <p className={pClasses}>
          Picture Saturday. A stranger saw a Reel, opened the bio, picked SUV
          interior, paid a deposit, and landed on your calendar. You did not
          quote in a DM. You did not type “I have 10 or 2.” The slot is paid
          before you load the van.
        </p>
        <p className={pClasses}>
          Friday night they already got a reminder. You open the iOS or Android
          app, see the address, and tap on-the-way when you leave. When you
          finish, you mark the job complete. ServiceLink texts a review request
          (email if there is no phone). The receipt goes out if you collected
          the rest on Tap to Pay or a card link. The client, the SUV, and the
          visit are already in the CRM for next month.
        </p>
        <p className={pClasses}>
          That is the product. Confirmations and day-before reminders are
          automatic. Review requests are automatic. Google reviews you import
          show on the same public page as ServiceLink reviews, so the next
          stranger sees proof without leaving the link. Expenses on Pro let you
          log fuel and supplies after the job instead of a notes app in the cup
          holder.
        </p>
        <p className={pClasses}>
          Custom work still happens. Someone wants a ceramic quote or a two-day
          correction. You send a ServiceLink quote from the dashboard (Pro).
          They pay a deposit on the quote link. The rest of the week stays on
          the published menu. You are not opening a recon module to take a $180
          interior.
        </p>
        <p className={pClasses}>
          The booking page also carries your service area, photos, and hours.
          Availability, buffers, and time off mean customers only see times you
          can actually run. That is how a one-truck shop looks booked without
          lying to the next DM.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>Who Mobile Tech RX is built for</h2>
        <p className={pClasses}>
          Mobile Tech RX sells to auto reconditioning businesses. The Getting
          Started plan is one service module: you pick PDR, Hail, Paint & Body,
          Interior, Detail, PPF/Vinyl, Wheels, Glass, or Tint. The pitch on the
          pricing page is estimates, invoices, credit-card processing, before
          and after photos, and scheduling you control.
        </p>
        <p className={pClasses}>
          Higher plans add the recon-shop stack: QuickBooks, a client portal for
          estimate approval and payment, tech pay, subcontracting, deposits on
          estimates, OEM parts, ADAS, checklists, comparative pricing, workflow,
          and time tracking. That is a real product for shops that write
          estimates all day and bill dealers or insurance.
        </p>
        <p className={pClasses}>
          What MTX does not claim, as of November 2026: a public page where a
          stranger picks a package and books themselves. Their scheduling page
          answers “Can I add Scheduling to my website to let customers book
          themselves?” with “Not yet.” Scheduling is included on every plan. It
          is the shop’s calendar—start an estimate, assign a tech, send a
          reminder—not an Instagram bio link.
        </p>
        <p className={pClasses}>
          That FAQ is the product split. MTX wants you on the phone or in the
          portal first, then on the calendar. A mobile detailer who posts Reels
          wants the opposite: the stranger finishes the booking, then you show
          up. ServiceLink is the second workflow. MTX is the first.
        </p>
        <p className={pClasses}>
          Deposits on MTX are listed as “Deposits on Estimates” on Standard
          ($99/admin/month), not as a checkout hold on a public booking slot. If
          your no-show problem is people tapping a time on your link and
          ghosting, that is a ServiceLink job: deposit or full pay at checkout
          on Pro. Estimate deposits help when the job is a custom quote. Slot
          deposits help when the job is a published interior package.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>ServiceLink vs Mobile Tech RX snapshot</h2>
        <p className={pClasses}>
          ServiceLink Pro is $20/month or $200/year after five free
          appointments. MTX Getting Started is $39/admin/month ($429/year) plus
          $15 per extra user, with one service module. Standard is
          $99/admin/month. Pro is $199/admin/month. Yearly MTX billing is listed
          as one month free. Taxes and add-ons are extra on their page.
        </p>

        <div className="mb-6 overflow-x-auto rounded-xl border border-white/10">
          <div className="min-w-[32rem]">
            <div className={snapshotHeaderClasses}>
              <span>Category</span>
              <span className="text-white">ServiceLink</span>
              <span>Mobile Tech RX</span>
            </div>
            <div className={snapshotRowClasses}>
              <span className="font-medium text-gray-300">Price</span>
              <span className="text-gray-200">
                Free for 5 appointments, then Pro $20/mo or $200/yr
              </span>
              <span className="text-gray-400">
                $39 / $99 / $199 per admin per month (Nov 2026)
              </span>
            </div>
            <div className={`${snapshotRowClasses} bg-white/[0.02]`}>
              <span className="font-medium text-gray-300">Built for</span>
              <span className="text-gray-200">
                Solo mobile detailers: booking page + CRM
              </span>
              <span className="text-gray-400">
                Auto recon, PDR, PPF, tint, glass, body, detail modules
              </span>
            </div>
            <div className={snapshotRowClasses}>
              <span className="font-medium text-gray-300">Booking</span>
              <span className="text-gray-200">
                Public bio link. Guest checkout. No customer app
              </span>
              <span className="text-gray-400">
                Shop-controlled scheduling. No customer self-booking yet
              </span>
            </div>
            <div className={`${snapshotRowClasses} bg-white/[0.02]`}>
              <span className="font-medium text-gray-300">
                Reminders and reviews
              </span>
              <span className="text-gray-200">
                Confirmations, day-before reminders, review request after the
                job, Google reviews on the page
              </span>
              <span className="text-gray-400">
                Shop-controlled reminders inside the recon workflow
              </span>
            </div>
            <div className={snapshotRowClasses}>
              <span className="font-medium text-gray-300">CRM</span>
              <span className="text-gray-200">
                Clients, vehicles, visit history, notes, CSV import
              </span>
              <span className="text-gray-400">
                Vehicle records and recon job history
              </span>
            </div>
            <div className={`${snapshotRowClasses} bg-white/[0.02]`}>
              <span className="font-medium text-gray-300">Deposits</span>
              <span className="text-gray-200">
                Deposit or full pay at booking checkout (Pro)
              </span>
              <span className="text-gray-400">
                Deposits on estimates listed from Standard
              </span>
            </div>
            <div className={snapshotRowClasses}>
              <span className="font-medium text-gray-300">Quotes</span>
              <span className="text-gray-200">
                Published packages on the page. Quotes on Pro when a job is
                custom
              </span>
              <span className="text-gray-400">
                Unlimited estimates/invoices. Module-based pricing tools
              </span>
            </div>
            <div className={`${snapshotRowClasses} bg-white/[0.02]`}>
              <span className="font-medium text-gray-300">UI</span>
              <span className="text-gray-200">
                Sleek booking page + phone dashboard. Live the same day
              </span>
              <span className="text-gray-400">
                Modules, estimates, and shop workflow. Built as an ops suite
              </span>
            </div>
          </div>
        </div>

        <p className={pClasses}>
          Price is the honest line for a solo. Five free ServiceLink
          appointments exist so you can see the booking flow. MTX’s own plans
          page, as of November 2026, describes a 5-day free trial. What is also
          on that page is the admin-plus-user math: a helper on Getting Started
          is another $15/month. ServiceLink’s paid jump is Pro at $20, or Team
          later if a second person needs the shop.
        </p>
        <p className={pClasses}>
          Urable sits in a similar “heavier ops” bucket if you are comparing
          field-service suites rather than recon. See{' '}
          <Link
            href={ROUTES.RESOURCE_GUIDE('servicelink-vs-urable')}
            className={linkClasses}
          >
            Urable alternative for mobile detailers
          </Link>
          . Current ServiceLink limits and plan names are on{' '}
          <Link href={ROUTES.PRICING_PAGE} className={linkClasses}>
            /pricing
          </Link>
          .
        </p>
        <GuideProTip>
          If your leads still start in a DM, the software has to be a link those
          people can finish on a phone. An estimating calendar you fill in after
          the call is a different job—and a more expensive one.
        </GuideProTip>
        <p className={pClasses}>
          Do the bio-link test on your own phone. Open your current booking flow
          the way a stranger would: from Instagram, with one thumb, in a
          driveway. If they cannot pick a package, a vehicle size, a time, and a
          deposit without texting you, the software is still a shop calendar.
          ServiceLink is built so that stranger finishes. MTX is built so the
          shop starts the job after the call. Both can be good businesses. Only
          one of them is the better app for a solo mobile detailer.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>
          Who MTX is built for vs who picks ServiceLink
        </h2>
        <p className={pClasses}>
          MTX is built for shops whose Tuesday is PPF, vinyl, tint, PDR, hail,
          glass, paint/body, dealers, fleet, or insurance estimates. That is a
          recon and film business. ServiceLink is built for the mobile detailer
          whose Tuesday is interiors, full details, drive time, and a phone that
          will not stay dry.
        </p>
        <p className={pClasses}>
          Typical tells that ServiceLink is the better app:
        </p>
        <ul className={listClasses}>
          <li>
            You are on Getting Started for the Detail module, and you still
            quote packages in Instagram because customers cannot book themselves
          </li>
          <li>
            You do not need a second service module, tech pay, or dealer
            packages, but you are staring at $39–$99/month for a calendar
          </li>
          <li>
            No-shows are people who “booked” by text, not people who failed to
            approve an estimate in a portal
          </li>
          <li>
            You want sedan / SUV / truck prices on a public menu, reminders
            before the job, a review request after, and a client list that fills
            in from the booking
          </li>
        </ul>
        <p className={pClasses}>
          Getting Started also caps you at one MTX module. If you only sell
          mobile interiors and washes, you still do not get self-serve booking
          on that plan as of November 2026. Paying for a recon module to run a
          driveway week is the expensive version of a notepad. ServiceLink keeps
          the public menu, the CRM, the reminders, and the review request in one
          stack you can try for five jobs.
        </p>
        <p className={pClasses}>
          Deposits on a public checkout are the other split. If that is the hole
          in the week, read{' '}
          <Link
            href={ROUTES.RESOURCE_GUIDE(
              'stop-no-shows-deposits-mobile-detailing'
            )}
            className={linkClasses}
          >
            how to stop no-shows and take deposits
          </Link>
          . ServiceLink collects the deposit when they pick the time (Pro).
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>Price, trial, and what you actually pay</h2>
        <p className={pClasses}>
          ServiceLink is free for the first five appointments. The booking page
          stays up after those five. You upgrade to Pro when the calendar is
          real. Pro is $20/month or $200/year. Team is $60/month if a second
          person needs the shop, up to four people. Current names and caps are
          on{' '}
          <Link href={ROUTES.PRICING_PAGE} className={linkClasses}>
            /pricing
          </Link>
          .
        </p>
        <p className={pClasses}>
          MTX Getting Started is $39 per admin per month as of November 2026, or
          $429/year, plus $15 per extra user, for one service module. Standard
          is $99/admin/month. Pro is $199/admin/month. Their page lists a 5-day
          free trial and yearly billing as one month free. Taxes and add-ons are
          extra. That math is fine for a recon shop that lives in estimates. It
          is a lot of money for a solo detailer who still quotes interiors in
          Instagram because customers cannot book themselves.
        </p>
        <p className={pClasses}>
          Five ServiceLink jobs exist so you can see guest checkout, the CRM
          row, the reminder, and the review request before you pay. You do not
          need to configure modules to take a Saturday interior. Add four
          packages, set hours, share the link. Most shops are live the same day.
          That is the product a driveway week will actually open.
        </p>
        <p className={pClasses}>
          If you already have a CSV of names and numbers, import it. If you
          don’t, start with repeats and let new bookings write the rest. You
          will not clone a recon estimate history into a detailing CRM, and you
          do not need to. You need the phone numbers and the next deposited
          interior. ServiceLink is built for that handoff.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>How to move this week</h2>
        <p className={pClasses}>
          You can try ServiceLink without turning anything else off. The bio
          link is the only public change. Treat week one as a side-by-side:
          package jobs go through the new link. If the booking page produces
          deposited jobs and you never need a recon estimate that week, you have
          your answer.
        </p>
        <ol className={orderedListClasses}>
          <li>
            Create ServiceLink and add the four packages you actually sell this
            month, with vehicle prices
          </li>
          <li>
            Import clients if you have a CSV. If the old export is messy, start
            with phone numbers for repeats and let new bookings write the rest
          </li>
          <li>
            Put the ServiceLink URL in Instagram and Google. Reply to DMs with
            the link once
          </li>
          <li>
            On Pro, turn on deposits for jobs over an hour. Confirmations and
            day-before reminders go out on their own
          </li>
          <li>
            After you mark a job complete, ServiceLink sends the review request.
            Connect Google so those reviews show on the same page
          </li>
        </ol>
        <p className={pClasses}>
          You write custom quotes on Pro when a job does not fit the menu. You
          keep the iOS or Android app in the cup holder for on-the-way texts,
          Tap to Pay, and the complete-and-review-request step. That is a
          driveway week. It is not a dealer estimate week—and it should not be
          priced like one.
        </p>
        <p className={pClasses}>
          <Link href={blogGuideSignupPath(SLUG)} className={linkClasses}>
            Try the booking + CRM stack free
          </Link>
          — first five appointments. You do not have to cancel anything on day
          one.
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
                    Try ServiceLink free
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
        <h2 className={h2Classes}>The better app for the driveway week</h2>
        <p className={pClasses}>
          Mobile Tech RX is built for recon and estimating. For a mobile
          detailer who books from a bio, ServiceLink is the better app: a sleek
          booking page, a CRM, reminders, review requests, and a $20 Pro plan.{' '}
          <Link href={blogGuideSignupPath(SLUG)} className={linkClasses}>
            Try the booking + CRM stack free
          </Link>
          .
        </p>
      </section>
    </>
  );
}
