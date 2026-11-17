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
        If you searched{' '}
        <strong className="text-gray-300">best CRM for mobile detailers</strong>{' '}
        or <strong className="text-gray-300">detailing CRM software</strong>,
        you are not looking for a consumer app that books a wash for you. You
        are looking for the system you run the business on: who the customer is,
        what they drive, what you already did, and how they book the next job
        without a 14-message thread.
      </p>
      <p className={pClasses}>
        For a solo mobile detailer, the best CRM is the one attached to a
        booking page people actually finish. ServiceLink is that stack: a bio
        link, a client list that fills in from every appointment, vehicle-size
        prices, deposits, SMS reminders, review requests after the job, and a
        dashboard you can run from a wet phone. Free for the first 5
        appointments. Pro is $20/month or $200/year.
      </p>
      <p className={pClasses}>
        This guide compares ServiceLink with DetailDeck, Urable, QuoteIQ,
        Jobber, and Square on the jobs that happen between driveways. Prices
        below are from each company’s public site as of November 2026. They
        change. Confirm on the vendor’s pricing page before you switch.
      </p>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>What a detailing CRM actually has to do</h2>
        <p className={pClasses}>
          CRM here does not mean a sales pipeline with stages named “qualified
          lead.” For a one-truck or two-truck shop, a{' '}
          <strong className="text-gray-300">mobile detailing CRM</strong> has to
          hold the record of the work:
        </p>
        <ul className={listClasses}>
          <li>
            <strong className="text-gray-300">Clients</strong> — name, phone,
            email, and a note you wrote after the last visit
          </li>
          <li>
            <strong className="text-gray-300">Vehicles</strong> — sedan vs SUV
            vs truck, and enough detail that you do not re-ask “what do you
            drive?”
          </li>
          <li>
            <strong className="text-gray-300">Job history</strong> — what they
            booked, what they paid, when they were last there
          </li>
          <li>
            <strong className="text-gray-300">Follow-up</strong> — reminders
            before the job, a review request after, and a way to rebook from the
            record instead of scrolling Instagram DMs
          </li>
        </ul>
        <p className={pClasses}>
          A calendar alone is not a CRM. Neither is a notes app. If the booking
          does not write the client, the vehicle, and the visit, you will
          rebuild the same conversation next month.
        </p>
        <p className={pClasses}>
          Booking still matters. Most of your new jobs will not start inside a
          CRM screen. They start on Instagram, Google, or a text. The CRM has to
          sit behind a public booking page so the record builds itself.{' '}
          <Link
            href={ROUTES.RESOURCE_GUIDE(
              'best-booking-app-for-mobile-detailers'
            )}
            className={linkClasses}
          >
            Best booking app for mobile detailers
          </Link>{' '}
          covers the booking-link side. This page is the client-record side of
          the same problem.
        </p>
        <p className={pClasses}>
          See the full ServiceLink feature list on{' '}
          <Link href={ROUTES.FEATURES_PAGE} className={linkClasses}>
            /features
          </Link>
          .
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>
          Why solo mobile detailers pick ServiceLink
        </h2>
        <p className={pClasses}>
          We scored each product the way a solo mobile detailer actually uses
          software on a Tuesday: can a stranger book from the bio, is the slot
          paid, does the client land in a list you can find later, and will you
          still open the app after a six-job Saturday.
        </p>
        <p className={pClasses}>
          ServiceLink is built around that week. Claims in this article are
          checked against the live product.
        </p>
        <ol className={orderedListClasses}>
          <li>
            <strong className="text-gray-300">
              A booking page that is the CRM front door.
            </strong>{' '}
            Customers open myservicelink.app/yourname, pick a service and a
            time, and book as a guest. No customer app. Every booking writes
            name, phone, email, vehicle, and visit history.
          </li>
          <li>
            <strong className="text-gray-300">
              Automations you feel on the driveway.
            </strong>{' '}
            Confirmation SMS and email when they book. A day-before reminder so
            Saturday is real. On-the-way and job-complete texts from the phone.
            A review request after you mark the job done.
          </li>
          <li>
            <strong className="text-gray-300">
              Google reviews on the same page.
            </strong>{' '}
            Connect Google Business Profile and show imported Google reviews
            next to ServiceLink reviews on your booking page. Neighbors see
            proof without leaving the link.
          </li>
          <li>
            <strong className="text-gray-300">A sleek, simple UI.</strong>{' '}
            Change a price, an hour, or a package between jobs. The dashboard is
            built for a one-truck shop, not a 12-person dispatch board.
          </li>
          <li>
            <strong className="text-gray-300">
              A price that matches a solo shop.
            </strong>{' '}
            First 5 appointments free. Pro is $20/month or $200/year for
            unlimited bookings, vehicle-size prices, deposits, Tap to Pay,
            quotes, invoices, expenses, and sales. Team is $60/month when a
            second person needs the shop.
          </li>
        </ol>
        <p className={pClasses}>
          <Link href={blogGuideSignupPath(SLUG)} className={linkClasses}>
            Start a free ServiceLink CRM and booking page — first 5 appointments
            free
          </Link>
          .
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>What the CRM does after they book</h2>
        <p className={pClasses}>
          The client record is useless if you still hunt DMs to rebook. On
          ServiceLink the record is the job. Open a customer and you see the
          vehicles, the last visit, and the note you left when the interior was
          packed with dog hair. Next time you do not ask “what do you drive?”
        </p>
        <p className={pClasses}>
          Automations sit on that same record. Confirmation SMS and email go out
          when they book. A day-before reminder goes out so Saturday is real.
          From the phone you can send on-the-way and job-complete texts. When
          you mark the booking done, ServiceLink sends a review request— SMS
          first, email if there is no phone. Connect Google Business Profile and
          imported Google reviews show on the public page next to ServiceLink
          reviews.
        </p>
        <p className={pClasses}>
          Pro adds the money layer on top of the CRM: vehicle-size prices on the
          menu, deposits or full pay at checkout, Tap to Pay in the iOS and
          Android apps, quotes for jobs that do not fit a package, invoices and
          receipts, expense tracking for fuel and supplies, and sales or promo
          codes when you want a slow Tuesday to move. Memberships exist when you
          want repeat clients on a plan instead of a one-off text.
        </p>
        <p className={pClasses}>
          Free is enough to see the flow: booking page, calendar, up to five
          services, the client list, vehicles, review requests, and Google
          reviews on the page. The first five appointments include SMS and
          email. Then you upgrade. That is a cleaner try-it path than a
          $29–$110/month suite you have to configure before the first stranger
          can book.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>
          ServiceLink vs DetailDeck vs Urable vs QuoteIQ vs Jobber vs Square
        </h2>
        <p className={pClasses}>
          Entry prices look similar until you ask which plan includes a customer
          booking link. QuoteIQ’s Essentials plan and Urable’s Express plan are
          not the same product as a bio booking page with deposits. The table
          uses the plan you actually need for that job, with the public list
          price as of November 2026. Rows are the jobs ServiceLink is built to
          win: booking, CRM, reminders, reviews, deposits, and price.
        </p>

        <div className={tableWrapClasses}>
          <table className="min-w-[64rem] w-full text-left">
            <caption className="sr-only">
              Comparison of mobile detailing CRM tools by price, booking,
              reminders, reviews, deposits, and who each is built for
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
                  Price
                  <span className="block font-normal text-gray-500 normal-case tracking-normal">
                    Nov 2026 public list
                  </span>
                </th>
                <td className={tdStrongClasses}>
                  Free for the first 5 appointments. Pro $20/mo or $200/yr
                </td>
                <td className={tdMutedClasses}>
                  Solo Pro $29/mo (one published plan)
                </td>
                <td className={tdMutedClasses}>
                  Express $70/mo. Pro $110/mo. Enterprise $183/mo
                </td>
                <td className={tdMutedClasses}>
                  Essentials $29.99/mo. Self-booking starts on Elite $299.99/mo
                </td>
                <td className={tdMutedClasses}>
                  Core from $29/mo billed annually, $49/mo with no commitment (1
                  user)
                </td>
                <td className={tdMutedClasses}>
                  Free plan $0/mo plus card processing. Plus $49/mo per location
                </td>
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
                <td className={tdMutedClasses}>
                  Public booking link. No customer app
                </td>
                <td className={tdMutedClasses}>
                  Online booking listed on Pro ($110/mo), not Express
                </td>
                <td className={tdMutedClasses}>
                  InstaSchedule / customer self-booking is Elite and Max. Lower
                  plans are internal scheduling
                </td>
                <td className={tdMutedClasses}>
                  Online booking on Core. Heavier client hub / requests flow
                </td>
                <td className={tdMutedClasses}>
                  Booking site on the Free plan. Generic appointment tool
                </td>
              </tr>
              <tr className="border-b border-white/10">
                <th
                  className={`${tdClasses} font-medium text-gray-300`}
                  scope="row"
                >
                  Vehicle-size pricing
                </th>
                <td className={tdStrongClasses}>
                  Sedan / SUV / truck options on one service (Pro)
                </td>
                <td className={tdMutedClasses}>
                  Confirm current vehicle-price options on their site
                </td>
                <td className={tdMutedClasses}>
                  Custom services inside a broader ops suite
                </td>
                <td className={tdMutedClasses}>
                  Strong on custom estimates more than a published size menu
                </td>
                <td className={tdMutedClasses}>
                  Generic line items. Detailing sizes are a workaround
                </td>
                <td className={tdMutedClasses}>
                  Generic appointments. SUV vs sedan is on you
                </td>
              </tr>
              <tr className={`border-b border-white/10 ${rowAltClasses}`}>
                <th
                  className={`${tdClasses} font-medium text-gray-300`}
                  scope="row"
                >
                  Deposits
                </th>
                <td className={tdStrongClasses}>
                  Deposit or full pay at checkout on Pro
                </td>
                <td className={tdMutedClasses}>
                  Stripe deposits on the published plan
                </td>
                <td className={tdMutedClasses}>
                  Payments via Stripe/Square. Confirm deposit rules on the plan
                  you buy
                </td>
                <td className={tdMutedClasses}>
                  Online payments on lower plans. Self-serve booking is still
                  Elite
                </td>
                <td className={tdMutedClasses}>
                  Payments on Core. Automatic collection is a higher-plan
                  feature
                </td>
                <td className={tdMutedClasses}>
                  Deposits and prepay listed on Free. No-show fees start on Plus
                </td>
              </tr>
              <tr className="border-b border-white/10">
                <th
                  className={`${tdClasses} font-medium text-gray-300`}
                  scope="row"
                >
                  CRM
                </th>
                <td className={tdStrongClasses}>
                  Client list, vehicles, visit history, notes, CSV import
                </td>
                <td className={tdMutedClasses}>
                  Client CRM with vehicle history and notes
                </td>
                <td className={tdMutedClasses}>
                  Broader field-service CRM inside a denser ops suite
                </td>
                <td className={tdMutedClasses}>
                  Contacts, quotes, and invoices. Built for estimating
                </td>
                <td className={tdMutedClasses}>
                  Full field-service CRM. Built for multi-trade crews
                </td>
                <td className={tdMutedClasses}>
                  Client directory and appointment history
                </td>
              </tr>
              <tr className={`border-b border-white/10 ${rowAltClasses}`}>
                <th
                  className={`${tdClasses} font-medium text-gray-300`}
                  scope="row"
                >
                  Reminders and reviews
                </th>
                <td className={tdStrongClasses}>
                  SMS/email confirmations, day-before reminders, review request
                  after the job, Google reviews on the booking page
                </td>
                <td className={tdMutedClasses}>
                  Confirm current reminder and review tools on their site
                </td>
                <td className={tdMutedClasses}>
                  Confirm on the plan that includes booking
                </td>
                <td className={tdMutedClasses}>
                  Confirm on Elite if customers must self-book
                </td>
                <td className={tdMutedClasses}>
                  Reminders and automations on higher Jobber plans
                </td>
                <td className={tdMutedClasses}>
                  Appointment reminders on Square’s appointment tools
                </td>
              </tr>
              <tr className="border-b border-white/10">
                <th
                  className={`${tdClasses} font-medium text-gray-300`}
                  scope="row"
                >
                  Expenses, quotes, Tap to Pay
                </th>
                <td className={tdStrongClasses}>
                  Expenses, quotes, invoices, receipts, and Tap to Pay on Pro
                </td>
                <td className={tdMutedClasses}>
                  Confirm current tools on the $29 plan
                </td>
                <td className={tdMutedClasses}>
                  Invoicing and ops tools in a heavier suite
                </td>
                <td className={tdMutedClasses}>
                  Strong quotes and invoices. Booking is the expensive plan
                </td>
                <td className={tdMutedClasses}>
                  Invoicing is a Jobber strength. Built for crews
                </td>
                <td className={tdMutedClasses}>
                  Square payments. Not detailing-specific
                </td>
              </tr>
              <tr>
                <th
                  className={`${tdClasses} font-medium text-gray-300`}
                  scope="row"
                >
                  Built for
                </th>
                <td className={tdStrongClasses}>
                  Solo and small mobile detailers
                </td>
                <td className={tdMutedClasses}>Solo mobile detailers</td>
                <td className={tdMutedClasses}>
                  Shops that want a denser field-service suite
                </td>
                <td className={tdMutedClasses}>
                  Operators who live in estimates and can pay Elite to self-book
                </td>
                <td className={tdMutedClasses}>
                  Multi-trade crews and field-service teams
                </td>
                <td className={tdMutedClasses}>
                  Shops already in Square payments
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
          </a>{' '}
          and QuoteIQ’s 2026 plan help article,{' '}
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
          Ignore the cheapest tile on a pricing page until you find online
          booking and deposits. Urable Express and QuoteIQ Essentials are real
          products. They are not a customer-facing booking link.
        </GuideProTip>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>Best for solo mobile detailers</h2>
        <p className={pClasses}>
          If you book from Instagram, Google, and texts, you want one place for
          the link, the prices, the deposit, the client, the reminder, and the
          review ask. That is the job. ServiceLink is the app built to do that
          job without a field-service maze.
        </p>
        <h3 className={h3Classes}>ServiceLink</h3>
        <p className={pClasses}>
          Customers open your page, pick a service and a time, and book as a
          guest. Every booking writes the client. Vehicles and visit history sit
          on the profile so you can rebook without digging through chats.
          Confirmations and day-before reminders go out without you typing them.
          When you mark the job complete, ServiceLink asks for a review. Connect
          Google and those reviews show on the same booking page.
        </p>
        <p className={pClasses}>
          Pro is $20/month (or $200/year) for unlimited bookings, vehicle-size
          prices, deposits, SMS, quotes, invoices, expense tracking, sales, and
          Tap to Pay in the iOS and Android apps. Current limits are on{' '}
          <Link href={ROUTES.PRICING_PAGE} className={linkClasses}>
            /pricing
          </Link>
          .
        </p>
        <p className={pClasses}>
          <Link href={blogGuideSignupPath(SLUG)} className={linkClasses}>
            Start a free ServiceLink CRM and booking page — first 5 appointments
            free
          </Link>
          .
        </p>

        <h3 className={h3Classes}>DetailDeck</h3>
        <p className={pClasses}>
          DetailDeck is the closest like-for-like: another bio booking link for
          solo mobile detailers, with deposits and a client CRM. As of November
          2026 they publish one $29/month plan. ServiceLink is the better
          everyday pick for the same shop—simpler to live in, automations after
          the job, Google reviews on the page, expenses and Tap to Pay on Pro,
          and a cheaper start (five free appointments, then $20). Full write-up:{' '}
          <Link
            href={ROUTES.RESOURCE_GUIDE('servicelink-vs-detaildeck')}
            className={linkClasses}
          >
            DetailDeck alternative for mobile detailers
          </Link>
          .
        </p>

        <h3 className={h3Classes}>Square</h3>
        <p className={pClasses}>
          Square’s Free appointments plan is a $0 booking option. Processing
          fees still apply. It is a generic appointment tool: it will not care
          that an SUV interior is a different job than a sedan. Fine if you
          already take Square payments and your menu is simple. Move to
          ServiceLink when you want vehicle sizes, a detailing booking page, and
          a client list that is built for repeats.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>Who the heavier tools are built for</h2>
        <p className={pClasses}>
          Some products in this search are not bad. They are built for a
          different business than a one-truck mobile week. Solo detailers still
          pick ServiceLink for the booking page and the CRM. Here is who the
          other suites are aimed at.
        </p>
        <ul className={listClasses}>
          <li>
            <strong className="text-gray-300">Urable</strong> is a
            detailing-adjacent field-service suite. Express at $70/month (as of
            November 2026) is scheduling and invoicing with unlimited users.
            Online booking is listed on Pro at $110/month. That density is for
            shops that want a wide ops console. Comparison:{' '}
            <Link
              href={ROUTES.RESOURCE_GUIDE('servicelink-vs-urable')}
              className={linkClasses}
            >
              Urable alternative for mobile detailers
            </Link>
            .
          </li>
          <li>
            <strong className="text-gray-300">Jobber</strong> is built for
            field-service teams. Core starts at $29/month billed annually for
            one user on getjobber.com (as of November 2026). Connect and Grow
            add more users and automations. A plumber crew is the design center.
            A one-truck detailer needs a bio link.{' '}
            <Link
              href={ROUTES.RESOURCE_GUIDE(
                'jobber-alternative-mobile-detailers'
              )}
              className={linkClasses}
            >
              Jobber alternative for mobile detailers
            </Link>
            .
          </li>
          <li>
            <strong className="text-gray-300">QuoteIQ</strong> is strong at
            estimates, invoices, and AI-assisted quoting. Public pricing starts
            at $29.99/month for Essentials. Customer self-booking
            (InstaSchedule) is documented as Elite ($299.99/month) and Max. That
            is a quoting product first. ServiceLink is a booking page first,
            with quotes on Pro when a job does not fit the menu.
          </li>
        </ul>
        <p className={pClasses}>
          ServiceLink’s Team plan exists when more than one person needs the
          shop (up to four people, listed at $60/month or $600/year on{' '}
          <Link href={ROUTES.PRICING_PAGE} className={linkClasses}>
            /pricing
          </Link>
          ). It is still a detailing booking + CRM stack.
        </p>
        <p className={pClasses}>
          If your “CRM” is a camera roll and a message thread, you do not need
          more modules. You need a booking page that writes a client list,
          deposits so Saturday is not a gamble, and a review request when you
          finish. Deposits deep-dive:{' '}
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
          How to switch without losing your client list
        </h2>
        <p className={pClasses}>
          You do not have to delete the old tool on Monday. Run both for a week.
          The new link goes in the bio. The old one stays up until you are sure.
        </p>
        <ol className={orderedListClasses}>
          <li>
            Export what you can. Most CRMs will give you a CSV of names, phones,
            and emails. ServiceLink can import a client CSV, including vehicles
            when the file has them.
          </li>
          <li>
            Add your top four packages with sedan / SUV / truck prices. Leave
            ceramic and paint correction off the public menu until the link is
            live.
          </li>
          <li>
            Set availability you will actually honor. Block drive time. Turn on
            deposits for anything over an hour once you are on Pro.
          </li>
          <li>
            Put the ServiceLink URL in Instagram, TikTok, Google, and your text
            snippets. Reply to DMs with the link once.
          </li>
          <li>
            After a week of real bookings, turn off the old public link. Keep
            the old login until you have confirmed every repeat client is in the
            new list.
          </li>
        </ol>
        <p className={pClasses}>
          You will not get a perfect history transfer from every competitor. Get
          the phone numbers. The next visit writes the new history. Reminders
          and review requests start on the first ServiceLink job.
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
                    Start a free ServiceLink CRM
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
        <h2 className={h2Classes}>Start the CRM that books itself</h2>
        <p className={pClasses}>
          The best detailing CRM is the one your customers will actually use and
          you will actually open between jobs. For solo mobile detailers that is
          ServiceLink: a booking page, a client list, reminders, review
          requests, and a $20 Pro plan—not a field-service suite.{' '}
          <Link href={blogGuideSignupPath(SLUG)} className={linkClasses}>
            Start a free ServiceLink CRM and booking page — first 5 appointments
            free
          </Link>
          .
        </p>
      </section>
    </>
  );
}
