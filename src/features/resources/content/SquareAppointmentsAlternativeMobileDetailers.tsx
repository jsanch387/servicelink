import { ROUTES } from '@/constants/routes';
import { blogGuideSignupPath } from '@/features/marketing-attribution';
import { GuideBestFor } from '@/features/resources/components/GuideBestFor';
import { GuideCheckTable } from '@/features/resources/components/GuideCheckTable';
import { GuideFaqAccordion } from '@/features/resources/components/GuideFaqAccordion';
import { GuideMonthlyPriceChart } from '@/features/resources/components/GuideMonthlyPriceChart';
import { GuideProTip } from '@/features/resources/components/GuideCallouts';
import { PRICES_AS_OF } from '@/features/resources/data/competitorPrices';
import { getGuideBySlug } from '@/features/resources/data/guides';
import Link from 'next/link';

import {
  h2Classes,
  linkClasses,
  listClasses,
  orderedListClasses,
  pClasses,
  sectionClasses,
} from './guideContentStyles';

const SLUG = 'square-appointments-alternative-mobile-detailers';
const GUIDE_FAQS = getGuideBySlug(SLUG)?.faqs ?? [];

export function SquareAppointmentsAlternativeMobileDetailersContent() {
  return (
    <>
      <p className={pClasses}>
        Square is a payments tool many shops already have. For running a
        detailing business, ServiceLink is the Square Appointments alternative:
        packages, vehicle-size prices, a mobile-first booking page, deposits on
        Pro, a service area or shop address, and a CRM that fills in from every
        job.
      </p>
      <p className={pClasses}>
        You can take appointments on a generic booker. ServiceLink is the
        detailing CRM built around a bio link. Five appointments free, then Pro
        at $20/month. Industry page:{' '}
        <Link href={ROUTES.AUTO_DETAILING} className={linkClasses}>
          booking app for auto detailers
        </Link>
        . Roundup:{' '}
        <Link
          href={ROUTES.RESOURCE_GUIDE(
            'best-booking-apps-and-crms-for-mobile-detailers'
          )}
          className={linkClasses}
        >
          best booking apps and CRMs for mobile detailers
        </Link>
        .
      </p>
      <p className={pClasses}>
        Square prices below are from squareup.com/us/en/appointments/pricing as
        of {PRICES_AS_OF}.
      </p>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>Why detailers start on Square</h2>
        <p className={pClasses}>
          You already take cards. Appointments looks free. A calendar is better
          than a DM thread. That is a reasonable first week. It is not a
          detailing booking page.
        </p>
        <GuideBestFor>
          ServiceLink — mobile and shop detailers who need the customer to
          finish the booking without you quoting a Tahoe over text
        </GuideBestFor>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>What a detailing booking page has to do</h2>
        <p className={pClasses}>
          Generic appointment software schedules a person into a chair. Mobile
          detailing schedules a vehicle at a driveway or a bay.
        </p>
        <ul className={listClasses}>
          <li>Sedan, SUV, and truck prices on the same package</li>
          <li>Interior, exterior, full detail, add-ons</li>
          <li>A deposit at checkout on Pro so Saturday is real</li>
          <li>Service area for mobile, or a shop address for a storefront</li>
          <li>
            Client + vehicle history so the next visit is not a blank form
          </li>
        </ul>
        <p className={pClasses}>
          ServiceLink is built around those jobs. Square Appointments is a
          generic booking site with Square payments attached.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>Side by side</h2>
        <GuideCheckTable
          caption="ServiceLink vs Square Appointments for mobile detailing"
          columns={[
            { id: 'sl', label: 'ServiceLink', highlight: true },
            { id: 'sq', label: 'Square Appointments' },
          ]}
          rows={[
            {
              feature: 'Public booking link',
              values: { sl: true, sq: true },
            },
            {
              feature: 'No customer app',
              values: { sl: true, sq: true },
            },
            {
              feature: 'Vehicle-size prices',
              values: { sl: true, sq: false },
            },
            {
              feature: 'Packages built for detailing',
              values: { sl: true, sq: false },
            },
            {
              feature: 'Deposit at checkout',
              values: { sl: true, sq: false },
            },
            {
              feature: 'Service area or shop address',
              values: { sl: true, sq: false },
            },
            {
              feature: 'CRM with vehicles',
              values: { sl: true, sq: false },
            },
            {
              feature: 'Team for a detailing shop',
              values: { sl: true, sq: false },
            },
          ]}
          footnote={`Deposit at checkout is on ServiceLink Pro. Square plan names from their Appointments pricing page, ${PRICES_AS_OF}.`}
        />
        <GuideMonthlyPriceChart
          bars={[
            { name: 'ServiceLink Pro', monthlyUsd: 20, highlight: true },
            { name: 'Square Free', monthlyUsd: 0 },
            { name: 'Square Plus', monthlyUsd: 49 },
            { name: 'Square Premium', monthlyUsd: 149 },
          ]}
          caption={`Software subscription only, ${PRICES_AS_OF}. Square still charges card processing.`}
        />
        <p className={pClasses}>
          Square Free is $0 per location. Plus is $49/month per location.
          Premium is $149/month per location. ServiceLink Pro is $20/month or
          $200/year after five free appointments. Team is $60/month for up to
          four people.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>How a job runs in ServiceLink</h2>
        <ol className={orderedListClasses}>
          <li>They open your link from Instagram, Google, or a text</li>
          <li>
            They pick SUV interior, an open Thursday slot, and pay a deposit on
            Pro
          </li>
          <li>You get the notification. The CRM already has the Tahoe</li>
          <li>
            They get a reminder the day before. You send on-the-way from the app
          </li>
          <li>You mark complete. ServiceLink asks for the review</li>
        </ol>
        <p className={pClasses}>
          That is the detailing day. A generic appointment booker stops at the
          time slot.{' '}
          <Link
            href={ROUTES.RESOURCE_GUIDE(
              'stop-no-shows-deposits-mobile-detailing'
            )}
            className={linkClasses}
          >
            How to stop no-shows and take deposits
          </Link>
          .
        </p>
        <GuideProTip>
          Keep taking Square cards in person if you want. ServiceLink payments
          run through Stripe. There is no Square connector to invent. Finish
          already-open Square appointments, then send every new inquiry to your
          ServiceLink.
        </GuideProTip>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>How to switch this week</h2>
        <ol className={orderedListClasses}>
          <li>
            Create the ServiceLink. Add four packages with sedan / SUV / truck
            prices
          </li>
          <li>
            Set hours you will honor. Turn on deposits on Pro for anything over
            an hour
          </li>
          <li>
            Put the link in Instagram, TikTok, Google Business Profile, and
            texts
          </li>
          <li>When someone DMs “you free Saturday?”, send the link once</li>
        </ol>
        <p className={pClasses}>
          <Link href={blogGuideSignupPath(SLUG)} className={linkClasses}>
            Start ServiceLink
          </Link>
          . Five appointments free. No card.
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
        <h2 className={h2Classes}>Verdict</h2>
        <p className={pClasses}>
          Square Appointments can hold a time. ServiceLink runs the detailing
          business: the booking link, the vehicle price, the deposit on Pro, the
          CRM, and Team.{' '}
          <Link href={blogGuideSignupPath(SLUG)} className={linkClasses}>
            Start free
          </Link>
          .
        </p>
      </section>
    </>
  );
}
