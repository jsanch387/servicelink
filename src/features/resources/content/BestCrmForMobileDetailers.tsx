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
        A lot of “best CRM” pages are written by tools that skip booking, or by
        field-service suites that treat detailing like lawn care. This guide is
        for working mobile detailers. It compares ServiceLink with DetailDeck,
        Urable, QuoteIQ, Jobber, and Square on the jobs that actually happen
        between driveways—not a 40-row feature matrix.
      </p>
      <p className={pClasses}>
        Prices and plan names below are from each company’s public site as of
        November 2026. They change. Confirm on the vendor’s pricing page before
        you switch.
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
            <strong className="text-gray-300">Follow-up</strong> — a way to text
            or rebook from the record instead of scrolling Instagram DMs
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
        <h2 className={h2Classes}>How we compared the tools</h2>
        <p className={pClasses}>
          We scored each product the way a solo mobile detailer actually uses
          software on a Tuesday:
        </p>
        <ol className={orderedListClasses}>
          <li>
            Can a customer book from a link in your bio, with no app download?
          </li>
          <li>Can you require a deposit so the slot is real?</li>
          <li>
            Does every booking save a client you can find later—not just a
            calendar block?
          </li>
          <li>
            Can you publish sedan / SUV / truck prices without a workaround?
          </li>
          <li>
            What do you pay for the plan that actually includes booking,
            deposits, and a client list?
          </li>
        </ol>
        <p className={pClasses}>
          We did not rank “most modules.” Extra modules help a shop with
          dispatch, inventory, or PPF estimating. They are not automatically
          better for a one-person mobile week. When a heavier tool is the right
          stay, this page says so.
        </p>
        <p className={pClasses}>
          ServiceLink claims in this article are checked against the live
          product: a shareable booking page, guest checkout, a client list with
          visit history and vehicles, CSV import, quotes, invoices, deposits,
          SMS reminders, and Tap to Pay on Pro. Free is the first five
          appointments. Pro is $20/month or $200/year. Team is a separate plan
          when more than one person needs the shop.
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
          price as of November 2026.
        </p>

        <div className={tableWrapClasses}>
          <table className="min-w-[64rem] w-full text-left">
            <caption className="sr-only">
              Comparison of mobile detailing CRM tools by price, booking,
              deposits, CRM depth, and who each is for
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
              <tr className={`border-b border-white/10 ${rowAltClasses}`}>
                <th
                  className={`${tdClasses} font-medium text-gray-300`}
                  scope="row"
                >
                  CRM depth
                </th>
                <td className={tdStrongClasses}>
                  Client list, vehicles, visit history, notes, CSV import.
                  Rebook from the record
                </td>
                <td className={tdMutedClasses}>
                  Client CRM with vehicle history, notes, and LTV. Expense
                  tracking and win-back automations on the same plan
                </td>
                <td className={tdMutedClasses}>
                  Broader field-service CRM: customers, vehicles, routing,
                  inventory, team tools
                </td>
                <td className={tdMutedClasses}>
                  Strong quotes, invoices, contacts, and AI tools. Built for
                  home-service / contracting more than detailing packages
                </td>
                <td className={tdMutedClasses}>
                  Full field-service CRM: quotes, invoices, clients, reporting.
                  Built for multi-trade crews
                </td>
                <td className={tdMutedClasses}>
                  Client directory and appointment history. Not
                  detailing-specific
                </td>
              </tr>
              <tr>
                <th
                  className={`${tdClasses} font-medium text-gray-300`}
                  scope="row"
                >
                  Who it’s for
                </th>
                <td className={tdStrongClasses}>
                  Solo and small mobile detailers who want a bio link plus a
                  client list
                </td>
                <td className={tdMutedClasses}>
                  Solo mobile detailers who want deposits and extras like
                  expense tracking on one $29 plan
                </td>
                <td className={tdMutedClasses}>
                  Shops that already want a denser ops suite and will pay for
                  Pro to unlock booking
                </td>
                <td className={tdMutedClasses}>
                  Operators who live in estimates, AI quoting, or financing—and
                  can pay Elite if customers must self-book
                </td>
                <td className={tdMutedClasses}>
                  Crews that need dispatch, a bigger ops suite, and Jobber’s
                  invoicing
                </td>
                <td className={tdMutedClasses}>
                  Detailers already in Square payments who can live with a
                  generic appointment page
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className={pClasses}>
          Sources, as of November 2026:{' '}
          <a href="https://myservicelink.app/pricing" className={linkClasses}>
            ServiceLink pricing
          </a>
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
          If you book from Instagram, Google, and texts, you want four things in
          one place: a link, vehicle-size prices, deposits, and a client list
          that fills in when someone books. That is the job. You do not need
          dispatch, inventory, or an estimating matrix on day one.
        </p>
        <h3 className={h3Classes}>ServiceLink</h3>
        <p className={pClasses}>
          ServiceLink is built around that week. Customers open your page, pick
          a service and a time, and book as a guest. Every booking writes the
          client. Vehicles and visit history sit on the profile so you can
          rebook without digging through chats. Free covers the first five
          appointments so you can see if the flow fits before you pay. Pro is
          $20/month (or $200/year) for unlimited bookings, vehicle-size prices,
          deposits, SMS reminders, quotes, invoices, and Tap to Pay.
        </p>
        <p className={pClasses}>
          What ServiceLink is not: a PPF estimating suite, a QuickBooks
          replacement, or a win-back automation engine. If those are the reason
          you opened a CRM tab, pick the tool that actually does them and skip
          the rest of this section.
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
          DetailDeck is the closest like-for-like. It is also a bio booking link
          for solo mobile detailers, with deposits and a client CRM. As of
          November 2026 they publish one $29/month plan and list extras
          ServiceLink does not: expense tracking, route sorting, conditional
          photo uploads, and win-back automations. Stay on DetailDeck if you
          already like that flow, or if those extras are how you run the week.
          Switch if you want a cheaper start (five free appointments, then $20)
          and a simpler daily app. Full write-up:{' '}
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
          Square’s Free appointments plan is the honest $0 booking option.
          Processing fees still apply. It is a generic appointment tool: it will
          not care that an SUV interior is a different job than a sedan. Use it
          if you already take Square payments and your menu is simple. Move when
          you are tired of explaining vehicle sizes in DMs.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>Best if you already have a shop or crew</h2>
        <p className={pClasses}>
          Once you have people to assign, inventory to track, or a second trade
          on the same calendar, a lean booking CRM can feel small. That is not a
          failure of the lean tool. It is a different business.
        </p>
        <ul className={listClasses}>
          <li>
            <strong className="text-gray-300">Urable</strong> is the detailing-
            adjacent ops suite. Express at $70/month (as of November 2026) is
            scheduling and invoicing with unlimited users, but online booking is
            listed on Pro at $110/month. Stay if you already live in Urable and
            use the denser modules. Comparison:{' '}
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
            add reminders, automations, and more users. Stay if you have a crew,
            need dispatch, or already run invoicing there.{' '}
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
            (InstaSchedule) is documented as Elite ($299.99/month) and Max. Stay
            if quoting and financing are the product and you do not need a bio
            booking link on the cheap plan.
          </li>
        </ul>
        <p className={pClasses}>
          ServiceLink’s Team plan exists when more than one person needs the
          shop (up to four people, listed at $60/month or $600/year on{' '}
          <Link href={ROUTES.PRICING_PAGE} className={linkClasses}>
            /pricing
          </Link>
          ). It is still a detailing booking + CRM stack, not a 15-tech dispatch
          platform.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>
          When a generic field-service CRM is enough
        </h2>
        <p className={pClasses}>
          Stay on Jobber, Urable, QuoteIQ, or Square when the tool already
          matches how you operate. Switching software in peak season because a
          blog post ranked a table is a real cost.
        </p>
        <p className={pClasses}>A generic or heavier CRM is enough if:</p>
        <ul className={listClasses}>
          <li>
            You have techs to assign, routes to optimize, or inventory that
            actually needs tracking
          </li>
          <li>
            QuickBooks, two-way SMS suites, or dealer/recon workflows are
            already how you get paid
          </li>
          <li>
            Your work is mostly custom estimates (PPF, multi-step correction,
            insurance) rather than a published menu
          </li>
          <li>
            The calendar is full, the no-show rate is under control, and nobody
            on the truck is fighting the app
          </li>
        </ul>
        <p className={pClasses}>
          It is not enough if your “CRM” is a camera roll and a message thread.
          In that case you do not need more modules. You need a booking page
          that writes a client list, and deposits so Saturday is not a gamble.
          Deposits deep-dive:{' '}
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
          the phone numbers. The next visit writes the new history.
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
          you will actually open between jobs. For most solo mobile detailers
          that is a booking page plus a client list—not a field-service suite.{' '}
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
