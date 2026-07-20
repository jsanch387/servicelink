import { ROUTES } from '@/constants/routes';
import { GuideFaqAccordion } from '@/features/resources/components/GuideFaqAccordion';
import { GuideProTip } from '@/features/resources/components/GuideCallouts';
import Link from 'next/link';

import {
  h2Classes,
  h3Classes,
  linkClasses,
  listClasses,
  pClasses,
  sectionClasses,
} from './guideContentStyles';

const comparisonRowClasses =
  'grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-1 sm:gap-4 py-4 border-b border-white/10 last:border-b-0';

export function BestBookingAppForMobileDetailersContent() {
  return (
    <>
      <p className={pClasses}>
        If you run a mobile detailing business, you have probably booked jobs
        through texts, Instagram DMs, and Facebook messages. That works when you
        are slow—but once you get busy, missed messages, double bookings, and
        endless back-and-forth start costing you money.
      </p>
      <p className={pClasses}>
        That is why more detailers are switching to a dedicated{' '}
        <strong className="text-gray-300">booking app for detailers</strong>—a
        simple way for customers to see your services, pick a time, and confirm
        without playing phone tag.
      </p>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>
          Why Detailers Need a Booking App (Not Just a Calendar)
        </h2>
        <p className={pClasses}>
          Generic schedulers were built for office meetings. Mobile detailing is
          different. Your jobs move. Service times change. Customers ask about
          add-ons. Weather pushes appointments around.
        </p>
        <p className={pClasses}>
          The best app for detailers should handle more than a time slot. It
          should show your full service menu, capture customer info, and let
          people book while you are on a job—not while they wait for you to
          reply to a DM.
        </p>
        <p className={pClasses}>Without a proper booking system, you risk:</p>
        <ul className={listClasses}>
          <li>Double-booking the same day because two people texted at once</li>
          <li>Losing serious customers who wanted to book immediately</li>
          <li>Quoting the wrong price because vehicle size was unclear</li>
          <li>No-shows on premium details with no deposit collected upfront</li>
        </ul>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>
          What to Look for in a Detailer Booking App
        </h2>
        <p className={pClasses}>
          Before you pick mobile detailing booking software, use this checklist.
          The best booking app for mobile detailers checks most of these boxes:
        </p>

        <h3 className={h3Classes}>1. A shareable booking link</h3>
        <p className={pClasses}>
          You need one link you can drop in your Instagram bio, Google Business
          profile, text replies, flyers, and vehicle wrap. Customers should book
          in a few taps—no app download required on their end.
        </p>

        <h3 className={h3Classes}>
          2. A real service menu—not just “1 hour slot”
        </h3>
        <p className={pClasses}>
          Your page should list interior details, exterior washes, ceramic
          coatings, packages, and add-ons. Customers should know what they are
          booking before they pick a time.
        </p>

        <h3 className={h3Classes}>3. Vehicle-based pricing</h3>
        <p className={pClasses}>
          Sedan, SUV, and truck pricing should be clear upfront. That cuts down
          on “how much for my Tahoe?” messages before every job.
        </p>

        <h3 className={h3Classes}>4. Availability you control</h3>
        <p className={pClasses}>
          You set the days and times you work. Customers only see open slots.
          When you are booked or off, those times disappear automatically.
        </p>

        <h3 className={h3Classes}>5. Deposits or in-app payments</h3>
        <p className={pClasses}>
          For higher-ticket details, requiring a deposit at booking reduces
          no-shows and filters out tire-kickers. Our guide on{' '}
          <Link
            href={ROUTES.RESOURCE_GUIDE(
              'stop-no-shows-deposits-mobile-detailing'
            )}
            className={linkClasses}
          >
            how to stop no-shows and take deposits
          </Link>{' '}
          covers how much to charge, a cancellation policy you can copy, and how
          to collect deposits automatically.
        </p>
        <GuideProTip>
          If customers can book without putting anything down, some of them
          never intended to show. Require a deposit on your booking link so the
          calendar only fills with serious jobs.
        </GuideProTip>

        <h3 className={h3Classes}>6. Customer info captured automatically</h3>
        <p className={pClasses}>
          Every booking should save name, phone, and email so you build a client
          list without spreadsheets or digging through message threads.
        </p>

        <h3 className={h3Classes}>7. Booking notifications</h3>
        <p className={pClasses}>
          You should get an email (or alert) when someone books—not discover new
          work hours later when you finally open Instagram.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>How Common Booking Options Compare</h2>
        <p className={pClasses}>
          There is no single “best app for detailers” for every business—but
          most detailers outgrow these approaches quickly:
        </p>

        <div className="rounded-xl border border-white/10 overflow-hidden mb-6">
          <div
            className={`${comparisonRowClasses} bg-white/[0.03] px-4 sm:px-5`}
          >
            <p className="text-sm font-semibold text-white">Texts & DMs</p>
            <p className="text-sm text-gray-400 leading-relaxed">
              Free and familiar, but easy to miss messages, hard to stay
              organized, and tough to look professional when you are scaling.
            </p>
          </div>
          <div className={`${comparisonRowClasses} px-4 sm:px-5`}>
            <p className="text-sm font-semibold text-white">
              Generic schedulers
            </p>
            <p className="text-sm text-gray-400 leading-relaxed">
              Fine for meetings, but most lack service menus, vehicle pricing,
              deposits, and a booking page that feels built for detailing.
            </p>
          </div>
          <div className={`${comparisonRowClasses} px-4 sm:px-5`}>
            <p className="text-sm font-semibold text-white">
              Detailer booking software
            </p>
            <p className="text-sm text-gray-400 leading-relaxed">
              Built for mobile service businesses: one booking link, your
              services, your schedule, and customer details in one place.
            </p>
          </div>
        </div>

        <p className={pClasses}>
          If you want a car detailing scheduling app that is simple to set up
          and easy for customers to use, look for tools designed around a
          shareable booking link—not just a calendar widget.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>
          Why ServiceLink Works for Mobile Detailers
        </h2>
        <p className={pClasses}>
          <Link href="/" className={linkClasses}>
            ServiceLink
          </Link>{' '}
          is built for local service pros who book jobs from social media,
          referrals, and search. Here is what detailers use most:
        </p>
        <ul className={listClasses}>
          <li>
            <strong className="text-gray-300">One booking link</strong> for your
            bio, texts, and Google profile—customers book as guests, no account
            required
          </li>
          <li>
            <strong className="text-gray-300">
              Service menu with categories
            </strong>{' '}
            and sedan/SUV/truck pricing on each service
          </li>
          <li>
            <strong className="text-gray-300">Availability calendar</strong> so
            customers only pick open times
          </li>
          <li>
            <strong className="text-gray-300">
              Deposits and in-app payments
            </strong>{' '}
            to lock in serious bookings
          </li>
          <li>
            <strong className="text-gray-300">Quote requests</strong> for custom
            jobs without long DM threads
          </li>
          <li>
            <strong className="text-gray-300">
              Client list from every booking
            </strong>{' '}
            — name, phone, and email saved automatically
          </li>
        </ul>
        <p className={pClasses}>
          Most detailers are live in under ten minutes: add your services, set
          your availability, and share your link.{' '}
          <Link href={ROUTES.AUTH.SIGNUP} className={linkClasses}>
            Create your free booking link
          </Link>
          .
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>Where to Put Your Booking Link</h2>
        <p className={pClasses}>
          The best booking app for detailers only helps if customers can find
          your link. Put it everywhere you already get inquiries:
        </p>
        <ul className={listClasses}>
          <li>Instagram and TikTok bio</li>
          <li>Google Business Profile</li>
          <li>Facebook page and local groups (where allowed)</li>
          <li>Text message auto-replies and missed-call texts</li>
          <li>Business cards, flyers, and vehicle wrap QR code</li>
          <li>After posting before/after content on social media</li>
        </ul>
        <p className={pClasses}>
          Pair your link with local content. Our guide on{' '}
          <Link
            href={ROUTES.RESOURCE_GUIDE(
              'how-mobile-detailers-get-clients-from-instagram-2026'
            )}
            className={linkClasses}
          >
            getting clients from Instagram
          </Link>{' '}
          walks through video ideas that drive people to your profile—and your
          booking page.
        </p>
      </section>

      <GuideFaqAccordion
        items={[
          {
            question: 'What is the best booking app for mobile detailers?',
            answer:
              'The best app depends on your workflow, but most detailers need a shareable booking link, service menu with clear pricing, controlled availability, and optional deposits—not just a basic calendar. ServiceLink is built around that flow for mobile service businesses.',
          },
          {
            question: 'Do my customers need to download an app to book?',
            answer:
              'No. With ServiceLink, customers open your booking link in their browser, pick a service and time, and confirm—no account or app download required on their end.',
          },
          {
            question: 'Can I require a deposit before confirming a booking?',
            answer:
              'Yes. You can collect a deposit or full payment at checkout so premium details are locked in before you drive to the job.',
          },
          {
            question: 'How fast can I set up a booking page?',
            answer: (
              <>
                Most detailers add their services, set availability, and share
                their link the same day—often in under ten minutes.{' '}
                <Link href={ROUTES.AUTH.SIGNUP} className={linkClasses}>
                  Start free here
                </Link>
                .
              </>
            ),
          },
        ]}
      />

      <section className={sectionClasses}>
        <h2 className={h2Classes}>Final Thoughts</h2>
        <p className={pClasses}>
          If you are still running your detailing business through scattered
          messages, upgrading to a booking app for detailers is one of the
          highest-leverage changes you can make. You look more professional,
          miss fewer leads, and spend less time coordinating and more time
          detailing.
        </p>
        <p className={pClasses}>
          Start with a simple booking link, share it everywhere customers find
          you, and let the app handle scheduling while you focus on the work.{' '}
          <Link href={ROUTES.AUTH.SIGNUP} className={linkClasses}>
            Get your free ServiceLink booking page
          </Link>
          .
        </p>
      </section>
    </>
  );
}
