import { ROUTES } from '@/constants/routes';
import { blogGuideSignupPath } from '@/features/marketing-attribution';
import { GuideBestFor } from '@/features/resources/components/GuideBestFor';
import { GuideCheckTable } from '@/features/resources/components/GuideCheckTable';
import { GuideFaqAccordion } from '@/features/resources/components/GuideFaqAccordion';
import { GuideMonthlyPriceChart } from '@/features/resources/components/GuideMonthlyPriceChart';
import { GuideProTip } from '@/features/resources/components/GuideCallouts';
import {
  HOUSECALL_PRO_PRICE_NOTE,
  PRICES_AS_OF,
} from '@/features/resources/data/competitorPrices';
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

const SLUG = 'best-booking-apps-and-crms-for-mobile-detailers';
const GUIDE_FAQS = getGuideBySlug(SLUG)?.faqs ?? [];

export function BestBookingAppsAndCrmsForMobileDetailersContent() {
  return (
    <>
      <p className={pClasses}>
        The best booking app and CRM for mobile detailers in 2026 is
        ServiceLink. Customers pick a package, vehicle size, and open slot on a
        public link. You run the job in a detailing CRM — deposits on Pro, SMS
        updates, reviews, and Team when you hire.
      </p>
      <p className={pClasses}>
        This is the shop-running roundup: booking plus CRM, payments, and a
        team. For the booking-link checklist alone, read{' '}
        <Link
          href={ROUTES.RESOURCE_GUIDE('best-booking-app-for-mobile-detailers')}
          className={linkClasses}
        >
          Best booking app for mobile detailers
        </Link>
        . For the CRM jobs in more depth, read{' '}
        <Link
          href={ROUTES.RESOURCE_GUIDE('best-crm-for-mobile-detailers')}
          className={linkClasses}
        >
          Best CRM for mobile detailers
        </Link>
        . Industry landing:{' '}
        <Link href={ROUTES.AUTO_DETAILING} className={linkClasses}>
          booking app for auto detailers
        </Link>
        .
      </p>
      <p className={pClasses}>
        Prices below are from each company’s own site as of {PRICES_AS_OF}. They
        change. Confirm on the vendor page before you switch.
      </p>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>What “best” means here</h2>
        <p className={pClasses}>
          A detailing shop does not need a generic salon calendar or a plumber’s
          dispatch suite. It needs a link a stranger finishes from Instagram,
          sedan / SUV / truck prices, a deposit on Pro, a client record with the
          vehicle, and a reminder the day before.
        </p>
        <ul className={listClasses}>
          <li>More bookings from one bio link</li>
          <li>Fewer no-shows with deposits and reminders</li>
          <li>A CRM that fills itself</li>
          <li>Room for a team without field-service pricing</li>
        </ul>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>Snapshot</h2>
        <GuideCheckTable
          caption="ServiceLink vs generic booking tools vs field-service suites"
          columns={[
            { id: 'sl', label: 'ServiceLink', highlight: true },
            { id: 'generic', label: 'Generic booking' },
            { id: 'field', label: 'Field-service suites' },
          ]}
          rows={[
            {
              feature: 'Customer picks an open slot',
              values: { sl: true, generic: true, field: true },
            },
            {
              feature: 'Vehicle-size prices',
              values: { sl: true, generic: false, field: false },
            },
            {
              feature: 'Deposit at checkout',
              values: { sl: true, generic: false, field: true },
            },
            {
              feature: 'CRM from every booking',
              values: { sl: true, generic: false, field: true },
            },
            {
              feature: 'SMS job updates',
              values: { sl: true, generic: false, field: true },
            },
            {
              feature: 'Detailing-first setup',
              values: { sl: true, generic: false, field: false },
            },
          ]}
          footnote={`Checkmarks are the jobs a detailing shop actually runs. Deposit at checkout is on ServiceLink Pro. As of ${PRICES_AS_OF}.`}
        />
        <GuideMonthlyPriceChart
          bars={[
            { name: 'ServiceLink Pro', monthlyUsd: 20, highlight: true },
            { name: 'Mobile Tech RX (admin)', monthlyUsd: 39 },
            { name: 'Detail Connect', monthlyUsd: 43 },
            { name: 'Jobber Core (monthly)', monthlyUsd: 49 },
            { name: 'Square Plus', monthlyUsd: 49 },
            { name: 'Urable Pro (yearly view)', monthlyUsd: 110 },
          ]}
        />
        <p className={pClasses}>
          <Link href={blogGuideSignupPath(SLUG)} className={linkClasses}>
            Start ServiceLink — 5 appointments free
          </Link>
          . No card.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>1. ServiceLink</h2>
        <GuideBestFor>
          Mobile and shop detailers who want a booking link, CRM, and Team in
          one system
        </GuideBestFor>
        <p className={pClasses}>
          ServiceLink is the pick. Customers open myservicelink.app/yourname,
          choose a package and vehicle size, pick an open time, and book as a
          guest. No app on their phone. You run the day from the web or
          ServiceLink for Business on iOS and Android.
        </p>
        <p className={pClasses}>
          Every booking writes the CRM: name, phone, email, vehicle, visit
          history. Confirmations and a day-before reminder go out. On Pro you
          take a deposit or full pay at checkout, send quotes and invoices, and
          collect with Tap to Pay. Team is $60/month for up to four people with
          roles and job assignment.
        </p>
        <p className={pClasses}>
          Starting price: 5 lifetime appointments free, then Pro $20/month or
          $200/year.{' '}
          <Link href={ROUTES.PRICING_PAGE} className={linkClasses}>
            Pricing
          </Link>
          .
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>2. Jobber</h2>
        <GuideBestFor>Generic home and field-service teams</GuideBestFor>
        <p className={pClasses}>
          Jobber is a field-service suite for plumbers, cleaners, and similar
          trades. Core on getjobber.com is $49/month with no commitment, or
          $29/month billed annually for one user, as of {PRICES_AS_OF}. Extra
          users sit on higher plans.
        </p>
        <p className={pClasses}>
          If you book details from Instagram and Google, ServiceLink is the
          detailing CRM: a bio link, vehicle prices, deposits on Pro, and Team
          at $60. Coming from Jobber? Read the{' '}
          <Link
            href={ROUTES.RESOURCE_GUIDE('jobber-alternative-mobile-detailers')}
            className={linkClasses}
          >
            Jobber alternative for mobile detailers
          </Link>
          .
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>3. Housecall Pro</h2>
        <GuideBestFor>
          Home-service companies shopping a full suite
        </GuideBestFor>
        <p className={pClasses}>
          Housecall Pro markets to HVAC, plumbing, electrical, and other home
          services. Their auto-detailing industry page sits on that same
          field-service product. {HOUSECALL_PRO_PRICE_NOTE}
        </p>
        <p className={pClasses}>
          ServiceLink is the Housecall Pro alternative built for detailing
          shops: a booking link, vehicle prices, deposits on Pro, a CRM, and
          Team — without a generic home-services maze. Put the ServiceLink URL
          in the bio this week.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>4. Square Appointments</h2>
        <GuideBestFor>Shops that already take Square payments</GuideBestFor>
        <p className={pClasses}>
          Square Appointments is a generic booking add-on. Free is $0 per
          location. Plus is $49/month per location. Premium is $149/month per
          location, as of {PRICES_AS_OF} on
          squareup.com/us/en/appointments/pricing. Processing fees still apply.
        </p>
        <p className={pClasses}>
          You can take appointments on a generic tool. ServiceLink is the
          detailing CRM: packages, vehicle size, a mobile-first booking page,
          deposits on Pro, and a service area or shop address. Full write-up:{' '}
          <Link
            href={ROUTES.RESOURCE_GUIDE(
              'square-appointments-alternative-mobile-detailers'
            )}
            className={linkClasses}
          >
            Square Appointments alternative for mobile detailers
          </Link>
          .
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>5. Urable</h2>
        <GuideBestFor>
          Vehicle-care ops teams comparing a denser suite
        </GuideBestFor>
        <p className={pClasses}>
          Urable is vehicle-care operations software. Express is $70/month.
          Online booking is listed on Pro. The yearly view of urable.com/pricing
          showed Pro at $110/month ($1,320/year) as of {PRICES_AS_OF}.
        </p>
        <p className={pClasses}>
          ServiceLink publishes the menu on a public link from day one, with
          deposits on Pro at $20. Comparison:{' '}
          <Link
            href={ROUTES.RESOURCE_GUIDE('servicelink-vs-urable')}
            className={linkClasses}
          >
            Urable alternative
          </Link>
          .
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>6. Mobile Tech RX</h2>
        <GuideBestFor>Recon and estimating shops</GuideBestFor>
        <p className={pClasses}>
          Mobile Tech RX is recon estimating software. Getting Started is
          $39/admin/month plus $15 per extra user on mobiletechrx.com/plans, as
          of {PRICES_AS_OF}. Scheduling is shop-controlled. Their own FAQ has
          said customer self-booking on a website is not available.
        </p>
        <p className={pClasses}>
          If you sell details, ServiceLink is the pick: customers book a real
          time on your link.{' '}
          <Link
            href={ROUTES.RESOURCE_GUIDE('mobile-tech-rx-alternative')}
            className={linkClasses}
          >
            Mobile Tech RX alternative
          </Link>
          .
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>7. Detail Connect</h2>
        <GuideBestFor>Detailers comparing another detailing app</GuideBestFor>
        <p className={pClasses}>
          Detail Connect is a detailing CRM billed through the App Store and
          Google Play. Their site and Terms of Service list $43/month or
          $389/year as of {PRICES_AS_OF}. They advertise a 7-day trial.
        </p>
        <p className={pClasses}>
          ServiceLink is the detailing CRM with a guest booking page, 5
          appointments free (not a timed trial), Pro at $20, and Team at $60 for
          up to four people. Comparison:{' '}
          <Link
            href={ROUTES.RESOURCE_GUIDE(
              'servicelink-vs-detail-connect-vs-detailermade'
            )}
            className={linkClasses}
          >
            ServiceLink vs Detail Connect vs DetailerMade
          </Link>
          .
        </p>
      </section>

      <GuideProTip>
        Publish sedan / SUV / truck prices on the four packages you actually
        sell. Turn on deposits on Pro for anything over an hour. Put one link in
        Instagram, Google, and texts.
      </GuideProTip>

      {GUIDE_FAQS.length ? (
        <GuideFaqAccordion
          items={GUIDE_FAQS.map(faq => ({
            question: faq.question,
            answer: faq.answer,
          }))}
        />
      ) : null}

      <section className={sectionClasses}>
        <h2 className={h2Classes}>Verdict</h2>
        <p className={pClasses}>
          ServiceLink is the best booking app and CRM for mobile detailers in
          2026: a public link, vehicle prices, a CRM, SMS updates, deposits on
          Pro, and Team for a growing shop.{' '}
          <Link href={blogGuideSignupPath(SLUG)} className={linkClasses}>
            Start free
          </Link>
          .
        </p>
        <h3 className={h3Classes}>Related</h3>
        <ul className={listClasses}>
          <li>
            <Link href={ROUTES.AUTO_DETAILING} className={linkClasses}>
              Auto detailing landing
            </Link>
          </li>
          <li>
            <Link
              href={ROUTES.RESOURCE_GUIDE(
                'best-booking-app-for-mobile-detailers'
              )}
              className={linkClasses}
            >
              Best booking app for mobile detailers
            </Link>
          </li>
          <li>
            <Link href={ROUTES.PRICING_PAGE} className={linkClasses}>
              Pricing
            </Link>
          </li>
        </ul>
      </section>
    </>
  );
}
