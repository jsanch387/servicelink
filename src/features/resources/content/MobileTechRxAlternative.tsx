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
        Mobile Tech RX is a serious auto-recon tool. If you searched{' '}
        <strong className="text-gray-300">Mobile Tech RX alternative</strong> or{' '}
        <strong className="text-gray-300">ServiceLink vs Mobile Tech RX</strong>
        , you are usually in one of two seats: you run PPF, tint, PDR, or
        dealership recon and MTX is doing real estimating work—or you are a solo
        mobile detailer paying recon-shop prices for a calendar.
      </p>
      <p className={pClasses}>
        This page is the second case. ServiceLink is not a clone of Mobile Tech
        RX. It is the simpler booking + CRM stack for detailers who need a bio
        link, vehicle-size prices, deposits, and a client list—not a dent
        matrix. If MTX is better for your shop, stay. The section below says
        when.
      </p>
      <p className={pClasses}>
        MTX prices and feature lists are from{' '}
        <a href="https://www.mobiletechrx.com/plans/" className={linkClasses}>
          mobiletechrx.com/plans
        </a>{' '}
        and their scheduling FAQ, as of November 2026.
      </p>

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
          That FAQ is the whole product split. MTX wants you on the phone or in
          the portal first, then on the calendar. A mobile detailer who posts
          Reels wants the opposite: the stranger finishes the booking, then you
          show up. Neither workflow is wrong. They are different businesses
          sharing the word “detail.”
        </p>
        <p className={pClasses}>
          Deposits on MTX are listed as “Deposits on Estimates” on Standard
          ($99/admin/month), not as a checkout hold on a public booking slot. If
          your no-show problem is people tapping a time on your link and
          ghosting, that is a different feature. Estimate deposits help when the
          job is a custom quote. Slot deposits help when the job is a published
          interior package.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>What solo mobile detailers actually need</h2>
        <p className={pClasses}>
          A one-truck interior/exterior week is not a hail pipeline. You need:
        </p>
        <ol className={orderedListClasses}>
          <li>A link you can drop in Instagram, Google, and texts</li>
          <li>A menu with sedan / SUV / truck prices</li>
          <li>Deposits so the slot is paid before you drive</li>
          <li>
            Names, numbers, vehicles, and job history so repeats are not a DM
            archaeology project
          </li>
        </ol>
        <p className={pClasses}>
          You do not need VIN-driven estimating, Black Book values, tech pay
          splits, or a second user seat on day one. Those matter when the
          business is recon, PPF film quotes, or a crew. Until then they are
          screens between you and the driveway.
        </p>
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
          roundup. MTX can store customers and cars. It is not built to be the
          booking page at the other end of a Reel.
        </p>
        <p className={pClasses}>
          Getting Started also caps you at one module. If you only sell mobile
          interiors and washes, “Detail” is enough—and you still do not get
          self-serve booking. If you add ceramic, PPF, and glass later, MTX
          wants you on Standard or Pro so more of the recon toolkit unlocks.
          ServiceLink does not try to be that toolkit. It keeps the public menu
          and the client list in one cheap stack, and you write custom quotes on
          Pro when a job does not fit the menu.
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
                Mobile detailers: booking page + CRM
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
              <span className="font-medium text-gray-300">Estimates</span>
              <span className="text-gray-200">
                Quotes on Pro. Published packages on the booking page
              </span>
              <span className="text-gray-400">
                Unlimited estimates/invoices. Module-based pricing tools
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
              <span className="font-medium text-gray-300">Vehicles</span>
              <span className="text-gray-200">
                Saved on the client. Sedan / SUV / truck prices on services
              </span>
              <span className="text-gray-400">
                Vehicle records, photos, VIN-oriented recon workflow
              </span>
            </div>
            <div className={snapshotRowClasses}>
              <span className="font-medium text-gray-300">Learning curve</span>
              <span className="text-gray-200">
                Services, hours, link. Most shops are live the same day
              </span>
              <span className="text-gray-400">
                Modules, estimates, and shop workflow. Built as an ops suite
              </span>
            </div>
          </div>
        </div>

        <p className={pClasses}>
          Price is not the only line, but it is the honest one for a solo. Five
          free ServiceLink appointments exist so you can see the booking flow.
          MTX’s own plans page, as of November 2026, describes a 5-day free
          trial. What is also on that page is the admin-plus-user math: a helper
          on Getting Started is another $15/month. ServiceLink’s paid jump is
          Pro at $20, or Team later if a second person needs the shop.
        </p>
        <p className={pClasses}>
          Urable sits in a similar “heavier ops” bucket if MTX feels like too
          much recon and not enough detailing booking. See{' '}
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
        <h2 className={h2Classes}>When to stay on Mobile Tech RX</h2>
        <p className={pClasses}>
          Stay if MTX is doing work ServiceLink is not built to replace. Fair
          reasons, as of November 2026:
        </p>
        <ul className={listClasses}>
          <li>
            You sell PPF, vinyl, tint, PDR, hail, glass, or paint/body as the
            core offer, and you use MTX’s module pricing, photos, and estimates
            every day
          </li>
          <li>
            Dealers, fleet, or insurance jobs need the client portal, dual
            invoicing, tech pay, or QuickBooks workflow on Standard/Pro
          </li>
          <li>
            You have multiple techs to assign, checklists, time tracking, or
            comparative repair-vs-replace math
          </li>
          <li>
            You already trained the shop on MTX and the calendar is full. Moving
            tools mid-season is a real cost
          </li>
        </ul>
        <p className={pClasses}>
          ServiceLink will not scan a VIN into a dent matrix, run ADAS
          calibrations, or replace MTX’s recon reporting. If that sentence
          describes your Tuesday, this is not your switch.
        </p>
        <p className={pClasses}>
          The other fair stay: you already send estimates from MTX, customers
          already log into the Standard client portal, and the pain is not
          “people cannot book from Instagram.” Replacing a working estimate
          machine with a booking page would be a downgrade. Keep MTX. Add a
          booking link only if package work is a second channel you want to
          ungate.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>When to switch</h2>
        <p className={pClasses}>
          Switch when the expensive part of MTX is not the part you use. A
          typical week for a solo mobile detailer is interiors, full details, a
          lot of drive time, and a phone that will not stay dry. The software
          has to survive that week in a cup holder. If you open MTX only to type
          an appointment you already sold in a DM, you are paying recon prices
          for a notepad.
        </p>
        <p className={pClasses}>Typical tells:</p>
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
            You want sedan / SUV / truck prices on a public menu and a client
            list that fills in from the booking
          </li>
        </ul>
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
          . ServiceLink collects the deposit when they pick the time (Pro). MTX
          collects commitment through estimates on a higher plan.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>How to move this week</h2>
        <p className={pClasses}>
          You can trial ServiceLink without turning MTX off. The bio link is the
          only public change. Treat week one as a side-by-side: package jobs go
          through the new link, custom film and PDR stay on MTX estimates. If
          the booking page produces deposited jobs and you never open the recon
          modules, you have your answer.
        </p>
        <ol className={orderedListClasses}>
          <li>
            Create ServiceLink and add the four packages you actually sell this
            month, with vehicle prices
          </li>
          <li>
            Import clients if you have a CSV. If MTX export is messy, start with
            phone numbers for repeats and let new bookings write the rest
          </li>
          <li>
            Put the ServiceLink URL in Instagram and Google. Leave MTX up for
            in-progress estimates
          </li>
          <li>
            Send the booking link once in DMs. Stop typing Saturday availability
            by hand
          </li>
          <li>
            On Pro, turn on deposits for jobs over an hour. Keep MTX for any
            PPF/tint/PDR estimates you still write there
          </li>
        </ol>
        <p className={pClasses}>
          Some shops keep MTX for film and PDR and use ServiceLink for mobile
          interiors. That is a valid split if both calendars stay honest. Do not
          double-book the same truck. Block MTX jobs as busy time on
          ServiceLink, or run package work on days you are not quoting film.
        </p>
        <p className={pClasses}>
          What you keep when you switch the bio: the phone numbers, the repeat
          interiors, and the hours you actually work. What you do not keep: MTX
          estimate templates, module pricing, tech pay, and portal history.
          Export what you can. Do not expect a perfect clone of recon records
          inside a detailing booking CRM.
        </p>
        <p className={pClasses}>
          <Link href={blogGuideSignupPath(SLUG)} className={linkClasses}>
            Try the simpler booking + CRM stack free
          </Link>
          — first five appointments, no need to cancel MTX on day one.
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
                    Try the simpler stack free
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
        <h2 className={h2Classes}>A simpler stack for the driveway week</h2>
        <p className={pClasses}>
          Mobile Tech RX is the right tool when estimating and recon workflow
          are the business. For a mobile detailer who books from a bio, it is
          usually more shop than you need.{' '}
          <Link href={blogGuideSignupPath(SLUG)} className={linkClasses}>
            Try the simpler booking + CRM stack free
          </Link>
          .
        </p>
      </section>
    </>
  );
}
