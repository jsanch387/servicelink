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

const SLUG = 'how-to-get-more-mobile-detailing-clients';
const GUIDE_FAQS = getGuideBySlug(SLUG)?.faqs ?? [];

export function HowToGetMoreMobileDetailingClientsContent() {
  return (
    <>
      <p className={pClasses}>
        Most mobile detailers do not have a “lead” problem. They have a
        finishing problem. People see the work, send a DM, ask for a price, go
        quiet, and you call that marketing. If you want to know{' '}
        <strong className="text-gray-300">
          how to get more mobile detailing clients
        </strong>
        , start by making booking obvious—then put proof where locals already
        look.
      </p>
      <p className={pClasses}>
        This is the umbrella playbook: booking, Instagram and TikTok, Google
        Business Profile, referrals, and small paid tests. It is not a promise
        of a full calendar in 30 days, and it does not invent average earnings.
        It is the sequence that turns attention into appointments you can run.
      </p>
      <p className={pClasses}>
        Instagram-only tactics live in{' '}
        <Link
          href={ROUTES.RESOURCE_GUIDE(
            'how-mobile-detailers-get-clients-from-instagram'
          )}
          className={linkClasses}
        >
          how mobile detailers get clients from Instagram
        </Link>
        . This page is the rest of the week.
      </p>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>Why DMs and hope don’t scale</h2>
        <p className={pClasses}>
          DMs feel like business because they are busy. They are also where jobs
          go to die. You are on a driveway with wet hands. Someone asks “how
          much for an SUV interior this Saturday?” You answer two hours later.
          They booked someone else, or they never meant to book.
        </p>
        <p className={pClasses}>The pattern looks like this:</p>
        <ul className={listClasses}>
          <li>A Reel does well. Your DMs fill with “how much?”</li>
          <li>You quote from memory. Every Tahoe is a custom novel</li>
          <li>Half the threads go cold. A few want to Venmo a “maybe”</li>
          <li>
            The people who do book still flake, because nothing was paid and
            nothing was on a calendar they can see
          </li>
        </ul>
        <p className={pClasses}>
          Hope is posting until someone serious appears. A system is a public
          menu, a real slot, and a deposit. You still talk to customers. You
          stop being the receptionist, the quote engine, and the reminder app
          between jobs.
        </p>
        <p className={pClasses}>
          None of this requires a huge following. A local who needs an interior
          this week does not care that a clip did well in another state. They
          care whether you work their zip, what it costs, and whether they can
          pick a time without waiting on you. Fix that path
          first. Then post.
        </p>
        <p className={pClasses}>
          If you do not have a menu yet, price packages before you chase more
          leads. Underpriced busy is not growth.{' '}
          <Link
            href={ROUTES.RESOURCE_GUIDE(
              'how-much-to-charge-for-mobile-detailing'
            )}
            className={linkClasses}
          >
            How much to charge for mobile detailing
          </Link>{' '}
          is the companion to this page. New shop?{' '}
          <Link
            href={ROUTES.RESOURCE_GUIDE(
              'how-to-start-a-mobile-detailing-business'
            )}
            className={linkClasses}
          >
            How to start a mobile detailing business
          </Link>
          .
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>
          Make booking obvious (bio link, Google, deposits)
        </h2>
        <p className={pClasses}>
          Before you post more, fix the last step. If a local watches a
          15-second clip and cannot book in one tap, the content is unpaid
          advertising for a business they cannot hire.
        </p>
        <h3 className={h3Classes}>One booking link, everywhere</h3>
        <p className={pClasses}>
          Use one URL. Instagram bio, TikTok bio, Google profile, text snippets,
          email signature, and the Link sticker on Reels. Customers should not
          need an account or an app. They pick a service, a vehicle size, a
          time, and confirm.
        </p>
        <p className={pClasses}>
          ServiceLink is built for that flow: a page at
          myservicelink.app/yourname, guest checkout, and a client list that
          fills in from the booking. Free covers the first five appointments.
          Pro is $20/month or $200/year for unlimited bookings, deposits, SMS
          reminders, and the rest of the paid tools. Plan names live on{' '}
          <Link href={ROUTES.PRICING_PAGE} className={linkClasses}>
            /pricing
          </Link>
          . Booking-app checklist:{' '}
          <Link
            href={ROUTES.RESOURCE_GUIDE(
              'best-booking-app-for-mobile-detailers'
            )}
            className={linkClasses}
          >
            best booking app for mobile detailers
          </Link>
          .
        </p>
        <h3 className={h3Classes}>Google Business Profile is not optional</h3>
        <p className={pClasses}>
          Set the profile up as a service-area business. Put the same booking
          link in the website field. Use the real service area, not a fake
          storefront address. Categories and photos should match what you
          actually sell. Ask every finished job for a Google review the same
          day—text the link while the car is still shiny.
        </p>
        <h3 className={h3Classes}>Deposits make the lead real</h3>
        <p className={pClasses}>
          More inquiries are not more clients. A deposit filters the people who
          were only collecting quotes. It also protects the hour you blocked.
          Policy copy and amounts:{' '}
          <Link
            href={ROUTES.RESOURCE_GUIDE(
              'stop-no-shows-deposits-mobile-detailing'
            )}
            className={linkClasses}
          >
            how to stop no-shows and take deposits
          </Link>
          . On ServiceLink, deposits are a Pro checkout option—not something you
          chase in Venmo after they flake.
        </p>
        <p className={pClasses}>
          <Link href={blogGuideSignupPath(SLUG)} className={linkClasses}>
            Put a booking link in your bio this week — free to start
          </Link>
          .
        </p>
        <GuideProTip>
          If someone DMs “you free Saturday?”, send the link and stop. The
          people who want the job will tap it. The rest were never going to pay
          for a driveway visit.
        </GuideProTip>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>
          Instagram and TikTok that actually get local jobs
        </h2>
        <p className={pClasses}>
          Views in another state do not wash cars on your street. Local jobs
          come from videos that name the city, show a transformation, and point
          at the same booking link.
        </p>
        <p className={pClasses}>Post what you already do on the job:</p>
        <ul className={listClasses}>
          <li>
            Before/after interiors with the city in the first line of audio
          </li>
          <li>Foam, extraction, and pet-hair clips that are honestly local</li>
          <li>A 20-second “what this sedan interior includes” menu clip</li>
          <li>Customer reaction if they are comfortable on camera</li>
        </ul>
        <p className={pClasses}>
          Say the city out loud. Put it in the caption. Use the neighborhood
          only if you actually work it. Do not stuff twenty hashtags for cities
          you will not drive to.
        </p>
        <p className={pClasses}>
          Bio formula that is enough: service + city + booking link. Example:
          “Mobile detailing in Austin. Interiors, full details, ceramic. Book
          here →”. Captions can be short. The video does the selling. The link
          does the booking.
        </p>
        <p className={pClasses}>
          Consistency beats a content calendar you will not keep. Three or four
          real job clips a week is plenty. Film the first 15 seconds on the
          dirty car, not on a logo. Do not wait for a “content day.” The job is
          the content. Shoot the arrival, the worst corner of the interior, and
          the finish while the towels are still in your hand.
        </p>
        <p className={pClasses}>
          Reply to comments with the city and the link, not a custom quote. If
          they need a ceramic or a neglected-SUV exception, that is a quote
          request—ServiceLink has quote requests on Pro. Everything else should
          hit the menu. Full video breakdown:{' '}
          <Link
            href={ROUTES.RESOURCE_GUIDE(
              'how-mobile-detailers-get-clients-from-instagram'
            )}
            className={linkClasses}
          >
            Instagram client guide
          </Link>
          .
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>Google Business Profile and local proof</h2>
        <p className={pClasses}>
          Social is how strangers discover you. Google is how neighbors confirm
          you are real. A profile with photos, hours, a service area, and recent
          reviews will get booked even in weeks you did not post.
        </p>
        <p className={pClasses}>Do the unglamorous setup:</p>
        <ul className={listClasses}>
          <li>
            Service-area business, not a pin on a house you do not want visited
          </li>
          <li>
            Primary category that matches detailing, plus honest secondaries
          </li>
          <li>
            Photos of real jobs—exteriors, interiors, your setup—not stock foam
          </li>
          <li>The booking link as the website</li>
          <li>
            A short description that names mobile detailing, your city, and the
            packages you want
          </li>
        </ul>
        <p className={pClasses}>
          Reviews are the proof. Ask after every job. Make it easy: a text with
          the Google review link, sent when you send the after photos. Reply to
          every review. Do not buy reviews. Do not fake a storefront.
        </p>
        <p className={pClasses}>
          Nextdoor, neighborhood Facebook groups, and apartment community boards
          still work when the post is a clear offer plus a link—not a hard
          pitch. One useful post with photos beats daily spam. Lead with the
          neighborhood you actually serve, a before/after, the starting package,
          and the booking URL. Pin a Google review if you have one.
        </p>
        <p className={pClasses}>
          Apartment boards, HOA newsletters, and office-park managers are slow
          and unglamorous. They also produce repeat interiors in the same
          parking garage. Offer a weekday window and a published price. Do not
          promise a mobile wash where the property forbids it—ask first.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>Referrals and rebooking</h2>
        <p className={pClasses}>
          The cheapest client is the one who already let you in the gate. If you
          are always hunting new Instagram strangers, the CRM is not doing its
          job.
        </p>
        <p className={pClasses}>
          Simple referral mechanics that do not feel slimy:
        </p>
        <ul className={listClasses}>
          <li>
            After a full detail, text: “If someone on the street asks, send them
            this link.” Attach the booking URL
          </li>
          <li>
            Offer a small, written thank-you on the next visit when a referral
            books and shows up—not a complicated points program
          </li>
          <li>
            Ask property managers, mobile mechanics, and independent lots if
            they want a standing weekday slot
          </li>
        </ul>
        <p className={pClasses}>
          Rebooking is the other half. Interiors come back. So do people who
          bought a maintenance wash. Put the next suggested window on the
          invoice or in the completion text (“same interior in 8–12 weeks—here
          is the link”). ServiceLink keeps visit history on the client so you
          are not guessing who disappeared.
        </p>
        <p className={pClasses}>
          Subscriptions for repeat clients exist on ServiceLink Pro if you want
          a standing plan. You do not need that on week one. You need the list
          and the habit of asking.
        </p>
        <p className={pClasses}>
          A usable follow-up text is one screen long: name, last service, link.
          “Hey Jordan—your Civic interior was in March. If you want the same
          before summer, here is the booking page.” That is the CRM doing its
          job. If those names still live only in Instagram, you will not send
          it.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>Simple paid tests</h2>
        <p className={pClasses}>
          Paid can fill gaps while organic is slow. It can also light money on
          fire if the landing page is a DM. Do not turn on Meta Advantage+. It
          is built to find cheap conversions across a wide audience. Mobile
          detailing is a driveway in a radius you can actually drive. Broad
          automation will show your ad to people you will not serve.
        </p>
        <p className={pClasses}>If you test paid, keep it boring and local:</p>
        <ul className={listClasses}>
          <li>
            A small daily budget you can afford to lose for two weeks—not a
            “scale” mindset
          </li>
          <li>
            A tight geo around the neighborhoods you already work. Exclude
            everything else
          </li>
          <li>
            One offer, one booking link, one creative (a real before/after). No
            five-ad science fair
          </li>
          <li>
            Optimize for people who finish the booking, not for “messages” or
            vague traffic
          </li>
        </ul>
        <p className={pClasses}>
          Boosting a Reel to the whole metro is not a test. A test has a zip
          list, a booking URL, and a stop date. If you want a walkthrough of
          local Meta ads that send people to a booking page, ServiceLink still
          offers a free ads workshop at{' '}
          <Link href={ROUTES.WORKSHOP} className={linkClasses}>
            /workshop
          </Link>
          . Use it for a controlled local campaign. Skip the “let the algorithm
          find customers” setting.
        </p>
        <p className={pClasses}>
          Google ads can work later for “mobile detailing” plus your city. They
          are optional. The free Google Business Profile does more for most
          solos than a search campaign you will not watch.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>A 30-day client-getting plan</h2>
        <p className={pClasses}>
          Use this as a checklist, not a guarantee. Adjust for weather, your
          current book of work, and how many hours you can film without skipping
          jobs.
        </p>
        <h3 className={h3Classes}>Days 1–3: the storefront</h3>
        <ol className={orderedListClasses}>
          <li>Write four packages with sedan / SUV / truck prices</li>
          <li>
            Publish them on a booking page.{' '}
            <Link href={blogGuideSignupPath(SLUG)} className={linkClasses}>
              Create the ServiceLink link
            </Link>{' '}
            if you do not have one
          </li>
          <li>Paste that URL in Instagram, TikTok, Google, and your texts</li>
          <li>
            On Pro, require a deposit for jobs over an hour. Write the
            cancellation rule on the page
          </li>
        </ol>
        <h3 className={h3Classes}>Days 4–14: proof</h3>
        <ol className={orderedListClasses}>
          <li>Finish Google Business Profile photos, area, and description</li>
          <li>Ask the next five customers for a Google review the same day</li>
          <li>
            Post three or four job clips a week. City in the audio. Link in the
            bio
          </li>
          <li>Stop quoting full packages in DMs. Send the link</li>
        </ol>
        <h3 className={h3Classes}>Days 15–30: repeats and a small test</h3>
        <ol className={orderedListClasses}>
          <li>
            Text past clients who have not booked in a while. One sentence, one
            link. No essay
          </li>
          <li>Ask two happy customers to refer a neighbor</li>
          <li>
            Optional: run a two-week local paid test to the booking page, with a
            tight map and no Advantage+
          </li>
          <li>
            Kill anything that does not produce booked, deposited jobs. Keep
            posting the work
          </li>
        </ol>
        <p className={pClasses}>
          If the calendar is still thin at day 30, the usual holes are price
          (too vague or too cheap), area (content for a city you do not serve),
          or booking (DMs instead of a link). Fix those before you buy more ads.
        </p>
        <p className={pClasses}>
          Also check the offer. “Mobile detailing” is not a reason to book.
          “Interior detail at your house, sedan price on the page, Saturday
          mornings open” is. Put the constraint in public: service area, vehicle
          sizes, what you do not do (no engine bays this month, no same-day
          ceramics). People book faster when they are not guessing.
        </p>
        <p className={pClasses}>
          Track only what you can see without analytics dashboards: bookings
          that showed up, Google reviews, and whether DMs dropped after the link
          went in the bio. If you later connect Search Console or pageviews, use
          those. Do not invent a “conversion rate” for the month.
        </p>
      </section>

      {GUIDE_FAQS.length ? (
        <GuideFaqAccordion
          items={GUIDE_FAQS.map(faq => ({
            question: faq.question,
            answer:
              faq.question ===
              'How fast can I put a booking link in my bio?' ? (
                <>
                  {faq.answer}{' '}
                  <Link
                    href={blogGuideSignupPath(SLUG)}
                    className={linkClasses}
                  >
                    Put a booking link in your bio
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
        <h2 className={h2Classes}>Book the next job from the bio</h2>
        <p className={pClasses}>
          Getting more mobile detailing clients is mostly unglamorous: a clear
          menu, a public link, local proof, and the nerve to stop living in DMs.{' '}
          <Link href={blogGuideSignupPath(SLUG)} className={linkClasses}>
            Put a booking link in your bio this week — free to start
          </Link>
          .
        </p>
      </section>
    </>
  );
}
