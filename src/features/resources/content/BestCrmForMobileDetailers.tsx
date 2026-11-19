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
  orderedListClasses,
  pClasses,
  sectionClasses,
} from './guideContentStyles';

const SLUG = 'best-crm-for-mobile-detailers';
const GUIDE_FAQS = getGuideBySlug(SLUG)?.faqs ?? [];

const tableWrapClasses =
  'mb-6 overflow-x-auto rounded-xl border border-white/10';
const thClasses =
  'px-3 sm:px-4 py-3 text-left text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400 whitespace-nowrap';
const tdClasses = 'px-3 sm:px-4 py-3.5 text-xs sm:text-sm align-top';
const tdMutedClasses = `${tdClasses} text-gray-400`;
const tdStrongClasses = `${tdClasses} text-gray-200`;
const rowAltClasses = 'bg-white/[0.02]';

export function BestCrmForMobileDetailersContent() {
  return (
    <>
      <p className={pClasses}>
        The{' '}
        <strong className="text-gray-300">best CRM for mobile detailers</strong>{' '}
        is the one that books the job, saves the client and the vehicle, takes
        the deposit, reminds them, and asks for the review—without a 14-message
        thread. That system is ServiceLink.
      </p>
      <p className={pClasses}>
        ServiceLink is a full detailing CRM and booking platform: public
        booking, client and vehicle history, automations, Google reviews on the
        page, quotes, invoices, expenses, Tap to Pay, and Team for up to four
        people. It is simple to use. It is the pick against DetailDeck, Urable,
        QuoteIQ, Jobber, and Square on the jobs that actually fill a shop.
      </p>
      <p className={pClasses}>
        Prices below are from each company’s public site as of November 2026.
        They change. Confirm on the vendor’s pricing page before you switch.
      </p>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>What a detailing CRM has to do</h2>
        <p className={pClasses}>
          CRM here does not mean a sales pipeline named “qualified lead.”{' '}
          <strong className="text-gray-300">Detailing CRM software</strong> has
          to run the shop:
        </p>
        <ul className={listClasses}>
          <li>
            <strong className="text-gray-300">More bookings</strong> — a public
            page people finish from Instagram and Google, with sedan / SUV /
            truck prices
          </li>
          <li>
            <strong className="text-gray-300">Fewer no-shows</strong> — deposits
            at checkout, confirmations, day-before reminders
          </li>
          <li>
            <strong className="text-gray-300">More reviews</strong> — a review
            request after every completed job, plus Google reviews on the same
            page
          </li>
          <li>
            <strong className="text-gray-300">Less admin</strong> — clients,
            vehicles, visit history, quotes, invoices, expenses, and a team that
            can run the job from the phone
          </li>
        </ul>
        <p className={pClasses}>
          A calendar without a client record is not a CRM. A CRM without a
          booking link still leaves you quoting in DMs.{' '}
          <Link
            href={ROUTES.RESOURCE_GUIDE(
              'best-booking-app-for-mobile-detailers'
            )}
            className={linkClasses}
          >
            Best booking app for mobile detailers
          </Link>{' '}
          covers the link. This page is the full system. Feature list:{' '}
          <Link href={ROUTES.FEATURES_PAGE} className={linkClasses}>
            /features
          </Link>
          .
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>Why ServiceLink is the pick</h2>
        <p className={pClasses}>
          We scored each product the way a detailing shop actually uses
          software: can a stranger book, is the slot paid, does the client land
          in a list, do reminders and reviews fire, and can a hire run the job
          from the app.
        </p>
        <ol className={orderedListClasses}>
          <li>
            <strong className="text-gray-300">More bookings.</strong> Customers
            open myservicelink.app/yourname, pick a service and a time, and book
            as a guest. Vehicle-size prices sit on the menu (Pro). Every booking
            writes name, phone, email, vehicle, and visit history.
          </li>
          <li>
            <strong className="text-gray-300">Fewer no-shows.</strong>{' '}
            Confirmation SMS and email. A day-before reminder. Deposit or full
            pay at checkout on Pro.{' '}
            <Link
              href={ROUTES.RESOURCE_GUIDE(
                'stop-no-shows-deposits-mobile-detailing'
              )}
              className={linkClasses}
            >
              How to stop no-shows and take deposits
            </Link>
            .
          </li>
          <li>
            <strong className="text-gray-300">More reviews.</strong> When you
            mark the job complete, ServiceLink sends a review request. Connect
            Google Business Profile and imported Google reviews show on the same
            booking page.
          </li>
          <li>
            <strong className="text-gray-300">Less admin.</strong> Quotes,
            invoices, receipts, expenses, sales, promo codes, Tap to Pay, and
            memberships on Pro. Native iOS and Android apps for the shop.
          </li>
          <li>
            <strong className="text-gray-300">Team when you hire.</strong> Team
            is $60/month or $600/year for up to four people. Member,
            Coordinator, and Manager roles. Assign jobs from the board.
            Teammates run on-the-way, Tap to Pay, and complete in the app.
          </li>
          <li>
            <strong className="text-gray-300">Value.</strong> Five appointments
            free. Pro $20/month or $200/year. That is the full stack—not a
            teaser tile that hides booking on a $110 plan. See{' '}
            <Link href={ROUTES.PRICING_PAGE} className={linkClasses}>
              /pricing
            </Link>
            .
          </li>
        </ol>
        <p className={pClasses}>
          Simple to use is how you get all of that without a field-service maze.
          Change a price, an hour, or an assignee between jobs.
        </p>
        <p className={pClasses}>
          <Link href={blogGuideSignupPath(SLUG)} className={linkClasses}>
            Start ServiceLink — first 5 appointments free
          </Link>
          .
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>What a ServiceLink shop week looks like</h2>
        <p className={pClasses}>
          Picture Saturday. A stranger saw a Reel, opened the bio, picked SUV
          interior, paid a deposit, and landed on the calendar. Nobody quoted in
          a DM. Nobody typed “I have 10 or 2.” The slot is paid before the van
          leaves. If a hire is on the job, they were assigned from the board.
        </p>
        <p className={pClasses}>
          Friday night that customer already got a reminder. The tech opens the
          iOS or Android app, sees the address, and taps on-the-way. When the
          job is complete, ServiceLink sends the review request. The receipt
          goes out if the rest was collected on Tap to Pay or a card link. The
          client, the SUV, and the visit are already in the CRM for next month.
        </p>
        <p className={pClasses}>
          Custom work still happens. Someone wants a ceramic quote or a two-day
          correction. You send a ServiceLink quote (Pro). They pay a deposit on
          the quote link. The rest of the week stays on the published menu.
          Expenses log fuel and supplies after the job instead of a notes app.
        </p>
        <p className={pClasses}>
          That is more bookings, fewer no-shows, more reviews, and less admin.
          It is the same stack whether you are the only one on the truck or you
          have three people on Team.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>Team, roles, and the phone in the van</h2>
        <p className={pClasses}>
          ServiceLink is not a one-person calendar that you outgrow. Team is
          $60/month or $600/year for up to four people on the shop. The owner
          invites by email. Roles are Member, Coordinator, and Manager.
        </p>
        <ul className={listClasses}>
          <li>
            <strong className="text-gray-300">Member</strong> — run assigned
            jobs, take Tap to Pay, change assignee
          </li>
          <li>
            <strong className="text-gray-300">Coordinator</strong> — plus
            create, reschedule, and cancel
          </li>
          <li>
            <strong className="text-gray-300">Manager</strong> — plus customers,
            quotes, invoices, expenses, reviews, shop settings
          </li>
        </ul>
        <p className={pClasses}>
          Assign jobs from the board. Filter “assigned to me.” Teammates get
          email, in-app, and push when a job lands on them. Money still lands on
          the owner’s Stripe. The calendar is shop-wide—not twelve personal
          calendars. That is the truthful cap: four people, roles, assignment,
          the same mobile app. It is enough to run a growing detailing shop
          without a field-service maze.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>Reviews, Google, and the money stack</h2>
        <p className={pClasses}>
          More reviews is not a hope. When you mark a job complete, ServiceLink
          sends a review request (SMS first, email if there is no phone). The
          customer lands on a ServiceLink review page. Connect Google Business
          Profile and imported Google reviews show on the same public booking
          page as those ServiceLink reviews. The next stranger sees proof
          without leaving the link.
        </p>
        <p className={pClasses}>
          Do not confuse that with a Google Maps ask. We do not text a Maps
          review URL. We do show Google reviews you already have, on the page
          people book from. That is the truthful split.
        </p>
        <p className={pClasses}>
          Pro is the money stack: deposits or full pay at checkout, Tap to Pay
          on the phone, quotes with a pay link, invoices, receipts, expenses
          (supplies, fuel, equipment, insurance, other), sales, promo codes, and
          memberships. Five appointments free exist so you can see guest
          checkout, the CRM row, the reminder, and the review request before you
          pay $20. Team is $60 when a second person needs the shop.
        </p>
        <p className={pClasses}>
          That is the full detailing CRM. It is simpler to use than a
          field-service suite. It is the pick against DetailDeck, Urable,
          QuoteIQ, Jobber, and Square on the jobs that fill a shop.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>
          ServiceLink vs DetailDeck vs Urable vs QuoteIQ vs Jobber vs Square
        </h2>
        <p className={pClasses}>
          Entry prices look similar until you ask which plan includes a customer
          booking link. QuoteIQ’s Essentials plan and Urable’s Express plan are
          not a bio booking page with deposits. The table uses the plan you
          actually need, with public list prices as of November 2026. Rows are
          the jobs ServiceLink wins: ease of use, booking, automations, reviews,
          team, and value.
        </p>

        <div className={tableWrapClasses}>
          <table className="min-w-[64rem] w-full text-left">
            <caption className="sr-only">
              Comparison of mobile detailing CRM tools. ServiceLink leads on
              ease of use, booking, automations, reviews, team, and value.
            </caption>
            <thead className="bg-white/[0.04] border-b border-white/10">
              <tr>
                <th className={thClasses} scope="col">
                  Category
                </th>
                <th className={`${thClasses} text-white`} scope="col">
                  ServiceLink
                </th>
                <th className={thClasses} scope="col">
                  DetailDeck
                </th>
                <th className={thClasses} scope="col">
                  Urable
                </th>
                <th className={thClasses} scope="col">
                  QuoteIQ
                </th>
                <th className={thClasses} scope="col">
                  Jobber
                </th>
                <th className={thClasses} scope="col">
                  Square
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/10">
                <th
                  className={`${tdClasses} font-medium text-gray-300`}
                  scope="row"
                >
                  Ease of use
                </th>
                <td className={tdStrongClasses}>
                  Simple daily app. Live the same day
                </td>
                <td className={tdMutedClasses}>Booking-link app</td>
                <td className={tdMutedClasses}>Denser field-service suite</td>
                <td className={tdMutedClasses}>Estimating-first</td>
                <td className={tdMutedClasses}>Generic field-service suite</td>
                <td className={tdMutedClasses}>Generic appointments</td>
              </tr>
              <tr className={`border-b border-white/10 ${rowAltClasses}`}>
                <th
                  className={`${tdClasses} font-medium text-gray-300`}
                  scope="row"
                >
                  Customer booking
                </th>
                <td className={tdStrongClasses}>
                  Public booking link. Guest checkout. No customer app
                </td>
                <td className={tdMutedClasses}>Public booking link</td>
                <td className={tdMutedClasses}>
                  Online booking listed on Pro ($110/mo), not Express
                </td>
                <td className={tdMutedClasses}>
                  Self-booking starts on Elite $299.99/mo
                </td>
                <td className={tdMutedClasses}>
                  Online booking on Core. Heavier client hub
                </td>
                <td className={tdMutedClasses}>Generic booking site</td>
              </tr>
              <tr className="border-b border-white/10">
                <th
                  className={`${tdClasses} font-medium text-gray-300`}
                  scope="row"
                >
                  Automations
                </th>
                <td className={tdStrongClasses}>
                  Confirmations, day-before reminders, on-the-way texts
                </td>
                <td className={tdMutedClasses}>Confirm on their site</td>
                <td className={tdMutedClasses}>
                  Confirm on the plan that includes booking
                </td>
                <td className={tdMutedClasses}>Confirm on Elite</td>
                <td className={tdMutedClasses}>
                  Reminders on higher Jobber plans
                </td>
                <td className={tdMutedClasses}>Appointment reminders</td>
              </tr>
              <tr className={`border-b border-white/10 ${rowAltClasses}`}>
                <th
                  className={`${tdClasses} font-medium text-gray-300`}
                  scope="row"
                >
                  Reviews
                </th>
                <td className={tdStrongClasses}>
                  Review request after every job. Google reviews on the page
                </td>
                <td className={tdMutedClasses}>Confirm on their site</td>
                <td className={tdMutedClasses}>Confirm on their site</td>
                <td className={tdMutedClasses}>Confirm on their site</td>
                <td className={tdMutedClasses}>Confirm on their site</td>
                <td className={tdMutedClasses}>Confirm on their site</td>
              </tr>
              <tr className="border-b border-white/10">
                <th
                  className={`${tdClasses} font-medium text-gray-300`}
                  scope="row"
                >
                  CRM
                </th>
                <td className={tdStrongClasses}>
                  Clients, vehicles, visit history, notes, CSV import
                </td>
                <td className={tdMutedClasses}>Client CRM with vehicles</td>
                <td className={tdMutedClasses}>Field-service CRM</td>
                <td className={tdMutedClasses}>Contacts and quotes</td>
                <td className={tdMutedClasses}>Field-service CRM</td>
                <td className={tdMutedClasses}>Client directory</td>
              </tr>
              <tr className={`border-b border-white/10 ${rowAltClasses}`}>
                <th
                  className={`${tdClasses} font-medium text-gray-300`}
                  scope="row"
                >
                  Team
                </th>
                <td className={tdStrongClasses}>
                  Up to 4 people. Roles, job assignment, mobile app
                </td>
                <td className={tdMutedClasses}>Confirm current seats</td>
                <td className={tdMutedClasses}>Unlimited users on Express</td>
                <td className={tdMutedClasses}>Confirm current seats</td>
                <td className={tdMutedClasses}>
                  Extra users on Connect / Grow
                </td>
                <td className={tdMutedClasses}>Per-location plans</td>
              </tr>
              <tr className="border-b border-white/10">
                <th
                  className={`${tdClasses} font-medium text-gray-300`}
                  scope="row"
                >
                  Deposits, Tap to Pay, expenses
                </th>
                <td className={tdStrongClasses}>
                  All on Pro, with receipts and invoices
                </td>
                <td className={tdMutedClasses}>
                  Stripe deposits on the $29 plan
                </td>
                <td className={tdMutedClasses}>Payments in the ops suite</td>
                <td className={tdMutedClasses}>
                  Strong quotes. Booking is Elite
                </td>
                <td className={tdMutedClasses}>Payments on Core</td>
                <td className={tdMutedClasses}>Square payments</td>
              </tr>
              <tr>
                <th
                  className={`${tdClasses} font-medium text-gray-300`}
                  scope="row"
                >
                  Price / value
                  <span className="block font-normal text-gray-500 normal-case tracking-normal">
                    Nov 2026 public list
                  </span>
                </th>
                <td className={tdStrongClasses}>
                  5 appointments free. Pro $20/mo or $200/yr. Team $60/mo
                </td>
                <td className={tdMutedClasses}>Solo Pro $29/mo</td>
                <td className={tdMutedClasses}>
                  Express $70/mo. Booking on Pro $110/mo
                </td>
                <td className={tdMutedClasses}>
                  Essentials $29.99/mo. Self-booking Elite $299.99/mo
                </td>
                <td className={tdMutedClasses}>
                  Core from $29/mo annual, $49/mo monthly (1 user)
                </td>
                <td className={tdMutedClasses}>
                  Free + processing. Plus $49/mo per location
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className={pClasses}>
          Sources, as of November 2026:{' '}
          <Link href={ROUTES.PRICING_PAGE} className={linkClasses}>
            ServiceLink pricing
          </Link>
          ,{' '}
          <a href="https://www.mydetaildeck.com/" className={linkClasses}>
            mydetaildeck.com
          </a>
          ,{' '}
          <a href="https://urable.com/pricing/" className={linkClasses}>
            urable.com/pricing
          </a>
          ,{' '}
          <a href="https://myquoteiq.com/pricing/" className={linkClasses}>
            myquoteiq.com/pricing
          </a>
          ,{' '}
          <a href="https://www.getjobber.com/pricing/" className={linkClasses}>
            getjobber.com/pricing
          </a>
          ,{' '}
          <a
            href="https://squareup.com/us/en/appointments/pricing"
            className={linkClasses}
          >
            Square Appointments pricing
          </a>
          .
        </p>
        <GuideProTip>
          Ignore the cheapest tile until you find online booking, deposits, and
          reminders. Urable Express and QuoteIQ Essentials are real products.
          They are not a customer-facing booking link.
        </GuideProTip>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>How the other tools compare</h2>
        <h3 className={h3Classes}>DetailDeck</h3>
        <p className={pClasses}>
          DetailDeck is another bio booking link with deposits and a client CRM.
          As of November 2026 they publish one $29/month plan. ServiceLink is
          the better system for the same shop: automations after the job, Google
          reviews on the page, expenses and Tap to Pay on Pro, Team for up to
          four people, and a stronger start (five free appointments, then $20).
          Full write-up:{' '}
          <Link
            href={ROUTES.RESOURCE_GUIDE('servicelink-vs-detaildeck')}
            className={linkClasses}
          >
            DetailDeck alternative for mobile detailers
          </Link>
          .
        </p>

        <h3 className={h3Classes}>Urable</h3>
        <p className={pClasses}>
          Urable is a detailing-adjacent field-service suite. Express is
          $70/month as of November 2026. Online booking is listed on Pro at
          $110/month. ServiceLink includes booking from day one, plus the CRM,
          automations, and Team, at Pro $20 or Team $60.{' '}
          <Link
            href={ROUTES.RESOURCE_GUIDE('servicelink-vs-urable')}
            className={linkClasses}
          >
            Urable alternative for mobile detailers
          </Link>
          .
        </p>

        <h3 className={h3Classes}>Jobber</h3>
        <p className={pClasses}>
          Jobber is generic field-service software. Core starts at $29/month
          billed annually for one user (as of November 2026). ServiceLink is the
          detailing CRM: vehicle-size prices, guest booking, review requests,
          and Team with roles and assignment.{' '}
          <Link
            href={ROUTES.RESOURCE_GUIDE('jobber-alternative-mobile-detailers')}
            className={linkClasses}
          >
            Jobber alternative for mobile detailers
          </Link>
          .
        </p>

        <h3 className={h3Classes}>QuoteIQ</h3>
        <p className={pClasses}>
          QuoteIQ is strong at estimates. Public pricing starts at $29.99/month
          for Essentials. Customer self-booking (InstaSchedule) is documented as
          Elite ($299.99/month) and Max. ServiceLink publishes packages on the
          booking page and still has quotes on Pro when a job is custom.
        </p>

        <h3 className={h3Classes}>Square</h3>
        <p className={pClasses}>
          Square’s Free appointments plan is a $0 generic calendar. Processing
          fees still apply. Move to ServiceLink when you want vehicle sizes, a
          detailing booking page, automations, reviews, and a CRM built for
          repeats.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>How to switch this week</h2>
        <ol className={orderedListClasses}>
          <li>
            Export a CSV of names, phones, and emails. ServiceLink can import
            clients and vehicles.
          </li>
          <li>
            Add your packages with sedan / SUV / truck prices. Set hours you
            will honor.
          </li>
          <li>
            Put the ServiceLink URL in Instagram, TikTok, Google, and texts.
            Reply to DMs with the link once.
          </li>
          <li>
            On Pro, turn on deposits. Reminders and review requests start on the
            first real job. Connect Google so reviews show on the page.
          </li>
          <li>
            When you hire, upgrade to Team. Invite them, pick a role, assign
            jobs from the board.
          </li>
        </ol>
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
          The best detailing CRM books the job, saves the client, takes the
          deposit, reminds them, asks for the review, and lets a teammate run
          the next one from the phone. That is ServiceLink.{' '}
          <Link href={blogGuideSignupPath(SLUG)} className={linkClasses}>
            Start ServiceLink — first 5 appointments free
          </Link>
          .
        </p>
      </section>
    </>
  );
}
