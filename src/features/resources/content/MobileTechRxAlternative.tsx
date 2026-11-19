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
        ServiceLink is the{' '}
        <strong className="text-gray-300">Mobile Tech RX alternative</strong>{' '}
        for mobile detailers. If you searched{' '}
        <strong className="text-gray-300">ServiceLink vs Mobile Tech RX</strong>
        , ServiceLink is the detailing CRM and booking system. MTX is recon
        estimating software. If you sell details, ServiceLink is the pick.
      </p>
      <p className={pClasses}>
        You get a public booking page, a CRM that fills in from every job, SMS
        reminders, review requests when you tap complete, deposits on Pro, Team
        for up to four people, and a UI you can run from the van. Five
        appointments free. Pro $20/month or $200/year. Team $60/month.
      </p>
      <p className={pClasses}>
        MTX prices and feature lists are from{' '}
        <a href="https://www.mobiletechrx.com/plans/" className={linkClasses}>
          mobiletechrx.com/plans
        </a>{' '}
        and their scheduling FAQ, as of November 2026.
      </p>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>Why ServiceLink is the pick</h2>
        <p className={pClasses}>
          Detailing shops win on outcomes: more bookings, fewer no-shows, more
          reviews, less admin. ServiceLink is built for that week—one operator
          or a growing team.
        </p>
        <ol className={orderedListClasses}>
          <li>
            <strong className="text-gray-300">More bookings.</strong> A public
            page at myservicelink.app/yourname. Guests pick a package and a
            time. No customer app.
          </li>
          <li>
            <strong className="text-gray-300">Fewer no-shows.</strong>{' '}
            Confirmation SMS/email, a day-before reminder, deposit or full pay
            at checkout on Pro.
          </li>
          <li>
            <strong className="text-gray-300">More reviews.</strong> A review
            request after you mark the job done. Google reviews on the same page
            when you connect Google Business Profile.
          </li>
          <li>
            <strong className="text-gray-300">Less admin.</strong> Clients,
            vehicles, visit history, notes, CSV import. Quotes, invoices,
            receipts, expenses, Tap to Pay on Pro. Native iOS and Android apps.
          </li>
          <li>
            <strong className="text-gray-300">Team.</strong> Up to four people.
            Member, Coordinator, and Manager roles. Assign jobs. Teammates run
            on-the-way, pay, and complete in the app.
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
          roundup. MTX can store customers and cars. As of November 2026 it
          still does not let a stranger finish a booking from a bio link.
        </p>
        <p className={pClasses}>
          <Link href={blogGuideSignupPath(SLUG)} className={linkClasses}>
            Start ServiceLink — first 5 appointments free
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
          before you load the van. If a teammate is on the job, you assigned
          them from the board.
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
          Confirmations and day-before reminders are automatic. Review requests
          are automatic. Google reviews you import show on the same public page
          as ServiceLink reviews, so the next stranger sees proof without
          leaving the link. Expenses on Pro let you log fuel and supplies after
          the job.
        </p>
        <p className={pClasses}>
          Custom work still happens. Someone wants a ceramic quote or a two-day
          correction. You send a ServiceLink quote from the dashboard (Pro).
          They pay a deposit on the quote link. The rest of the week stays on
          the published menu. You are not opening a recon module to take a $180
          interior.
        </p>
        <p className={pClasses}>
          When you hire, the same week still works. Upgrade to Team. Invite the
          new person, pick Member / Coordinator / Manager, assign the Saturday
          interior from the board. They run on-the-way, Tap to Pay, and complete
          in the iOS or Android app. You do not buy a second recon module or
          another $15 MTX user just so someone else can see the calendar.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>What Mobile Tech RX actually is</h2>
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
          and time tracking. That stack is for recon shops that write estimates
          all day and bill dealers or insurance. A detailing shop that sells
          packages from a bio link should run ServiceLink.
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
          Deposits on MTX are listed as “Deposits on Estimates” on Standard
          ($99/admin/month), not as a checkout hold on a public booking slot. If
          your no-show problem is people tapping a time on your link and
          ghosting, that is a ServiceLink job: deposit or full pay at checkout
          on Pro.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>ServiceLink vs Mobile Tech RX snapshot</h2>
        <p className={pClasses}>
          ServiceLink Pro is $20/month or $200/year after five free
          appointments. Team is $60/month for up to four people. MTX Getting
          Started is $39/admin/month ($429/year) plus $15 per extra user, with
          one service module. Standard is $99/admin/month. Pro is
          $199/admin/month. Yearly MTX billing is listed as one month free.
          Taxes and add-ons are extra on their page.
        </p>

        <div className="mb-6 overflow-x-auto rounded-xl border border-white/10">
          <div className="min-w-[32rem]">
            <div className={snapshotHeaderClasses}>
              <span>Category</span>
              <span className="text-white">ServiceLink</span>
              <span>Mobile Tech RX</span>
            </div>
            <div className={snapshotRowClasses}>
              <span className="font-medium text-gray-300">Ease of use</span>
              <span className="text-gray-200">
                Simple daily app. Live the same day
              </span>
              <span className="text-gray-400">
                Modules, estimates, and shop workflow
              </span>
            </div>
            <div className={`${snapshotRowClasses} bg-white/[0.02]`}>
              <span className="font-medium text-gray-300">Booking</span>
              <span className="text-gray-200">
                Public bio link. Guest checkout. No customer app
              </span>
              <span className="text-gray-400">
                Shop-controlled scheduling. No customer self-booking yet
              </span>
            </div>
            <div className={snapshotRowClasses}>
              <span className="font-medium text-gray-300">Automations</span>
              <span className="text-gray-200">
                Confirmations, day-before reminders, on-the-way texts
              </span>
              <span className="text-gray-400">
                Shop-controlled reminders inside the recon workflow
              </span>
            </div>
            <div className={`${snapshotRowClasses} bg-white/[0.02]`}>
              <span className="font-medium text-gray-300">Reviews</span>
              <span className="text-gray-200">
                Review request after every job. Google reviews on the page
              </span>
              <span className="text-gray-400">Confirm on their site</span>
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
              <span className="font-medium text-gray-300">Team</span>
              <span className="text-gray-200">
                Up to 4 people. Roles, job assignment, mobile app
              </span>
              <span className="text-gray-400">
                Extra users billed per admin plan
              </span>
            </div>
            <div className={snapshotRowClasses}>
              <span className="font-medium text-gray-300">Deposits</span>
              <span className="text-gray-200">
                Deposit or full pay at booking checkout (Pro)
              </span>
              <span className="text-gray-400">
                Deposits on estimates listed from Standard
              </span>
            </div>
            <div className={`${snapshotRowClasses} bg-white/[0.02]`}>
              <span className="font-medium text-gray-300">Price / value</span>
              <span className="text-gray-200">
                5 appointments free. Pro $20/mo. Team $60/mo
              </span>
              <span className="text-gray-400">
                $39 / $99 / $199 per admin per month (Nov 2026)
              </span>
            </div>
          </div>
        </div>

        <p className={pClasses}>
          Five free ServiceLink appointments exist so you can see the booking
          flow. MTX’s own plans page, as of November 2026, describes a 5-day
          free trial. A helper on MTX Getting Started is another $15/month.
          ServiceLink Team is $60/month for up to four people with roles and
          assignment.
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
          the call is a different job.
        </GuideProTip>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>Should a detailing shop use MTX?</h2>
        <p className={pClasses}>
          ServiceLink. Detailing shops need a public booking page, deposits, a
          CRM, reminders, and review requests. MTX is recon estimating. As of
          November 2026 their FAQ says customers cannot book themselves yet.
        </p>
        <p className={pClasses}>Typical tells that ServiceLink is the pick:</p>
        <ul className={listClasses}>
          <li>
            You are on Getting Started for the Detail module, and you still
            quote packages in Instagram because customers cannot book themselves
          </li>
          <li>
            You do not need a second service module, tech pay, or dealer
            packages, but you are staring at $39–$199/month for a calendar
          </li>
          <li>
            No-shows are people who “booked” by text, not people who failed to
            approve an estimate in a portal
          </li>
          <li>
            You want sedan / SUV / truck prices on a public menu, reminders
            before the job, a review request after, and a team that can run the
            next job from the phone
          </li>
        </ul>
        <p className={pClasses}>
          Getting Started also caps you at one MTX module. If you sell mobile
          interiors and washes, you still do not get self-serve booking on that
          plan as of November 2026. ServiceLink keeps the public menu, the CRM,
          the reminders, the review request, and Team in one stack you can try
          for five jobs.
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
          extra. That math is for a recon shop that lives in estimates. It is
          the wrong stack for a detailing shop that still quotes interiors in
          Instagram because customers cannot book themselves.
        </p>
        <p className={pClasses}>
          Five ServiceLink jobs exist so you can see guest checkout, the CRM
          row, the reminder, and the review request before you pay. Add four
          packages, set hours, share the link. Most shops are live the same day.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>How to move this week</h2>
        <p className={pClasses}>
          Move package bookings to ServiceLink this week. Put the ServiceLink
          link in Instagram, Google, and texts. New interiors, washes, and full
          details book there, with a deposit, a reminder, and a review request.
          Finish any recon estimate that is already open, then keep the
          detailing calendar on ServiceLink.
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
          <li>
            When you hire, upgrade to Team. Invite them, pick a role, assign
            jobs from the board
          </li>
        </ol>
        <p className={pClasses}>
          <Link href={blogGuideSignupPath(SLUG)} className={linkClasses}>
            Start ServiceLink — first 5 appointments free
          </Link>
          . Put that link in the bio the same day.
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
          Mobile Tech RX is recon estimating software. For a detailing shop that
          books from a bio, ServiceLink is the CRM: a booking page, automations,
          review requests, Team, and a $20 Pro plan.{' '}
          <Link href={blogGuideSignupPath(SLUG)} className={linkClasses}>
            Start ServiceLink — first 5 appointments free
          </Link>
          .
        </p>
      </section>
    </>
  );
}
