import { ROUTES } from '@/constants/routes';
import { GuideFaqAccordion } from '@/features/resources/components/GuideFaqAccordion';
import { GuideProTip } from '@/features/resources/components/GuideCallouts';
import { getGuideBySlug } from '@/features/resources/data/guides';
import Link from 'next/link';

import {
  h2Classes,
  linkClasses,
  listClasses,
  pClasses,
  sectionClasses,
} from './guideContentStyles';

const orderedListClasses =
  'list-decimal list-outside space-y-2.5 text-gray-400 mb-5 ml-5 marker:text-gray-500';
const blockquoteClasses =
  'border-l-[3px] border-white/30 pl-4 my-8 space-y-3 text-gray-400 leading-relaxed';

const GUIDE_FAQS =
  getGuideBySlug('stop-no-shows-deposits-mobile-detailing')?.faqs ?? [];

export function StopNoShowsDepositsMobileDetailingContent() {
  return (
    <>
      <p className={pClasses}>
        If you’ve been detailing for more than a few weeks, this has happened to
        you. You confirm a booking, clear your schedule, drive across town — and
        the customer ghosts. No call, no text, no vehicle. You just lost gas
        money, drive time, and a slot someone else would have paid for.
      </p>
      <p className={pClasses}>
        The fix isn’t hoping people show up. It’s requiring a deposit before you
        lock in the slot — and using a booking app for detailers like{' '}
        <Link href="/" className={linkClasses}>
          ServiceLink
        </Link>{' '}
        that collects that deposit from your booking link automatically.
      </p>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>What a No-Show Actually Costs You</h2>
        <p className={pClasses}>
          A missed appointment isn’t just an annoyance — it’s a math problem.
        </p>
        <ul className={listClasses}>
          <li>
            <strong className="text-gray-300">Wasted drive time.</strong> You
            don’t get that hour back.
          </li>
          <li>
            <strong className="text-gray-300">Wasted fuel.</strong> Mobile
            detailers eat this cost with nothing to show for it.
          </li>
          <li>
            <strong className="text-gray-300">A lost slot.</strong> Someone who
            would have actually shown up couldn’t book that time.
          </li>
          <li>
            <strong className="text-gray-300">Broken momentum.</strong> A
            no-show in the middle of your day throws off every job after it.
          </li>
        </ul>
        <p className={pClasses}>
          Detailers who don’t require anything upfront regularly deal with
          cancellation and no-show rates in the 15-25% range. That means roughly
          1 out of every 5 bookings could be a dead slot. Add deposits and
          reminders, and that number typically drops under 5%.
        </p>
        <p className={pClasses}>
          That gap is the difference between a full calendar and a part-time
          income.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>
          Why Deposits Work (It’s Not Just About the Money)
        </h2>
        <p className={pClasses}>
          A deposit does two things a “just show up” booking never does:
        </p>
        <ol className={orderedListClasses}>
          <li>
            <strong className="text-gray-300">
              It filters out tire-kickers.
            </strong>{' '}
            Someone who won’t put $25-$50 down was never a serious booking.
          </li>
          <li>
            <strong className="text-gray-300">It creates commitment.</strong>{' '}
            Once money is on the line, people mentally treat the appointment as
            real — not something they can casually blow off.
          </li>
        </ol>
        <p className={pClasses}>
          You’re not trying to punish customers. You’re trying to make sure the
          people on your calendar actually intend to be there. ServiceLink makes
          that easy: customers pay the deposit when they book, so the commitment
          is built into the booking flow — not something you have to chase after
          the fact.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>How Much Deposit Should You Charge?</h2>
        <p className={pClasses}>
          There’s no single right number, but most mobile detailers land in one
          of these ranges:
        </p>
        <p className={pClasses}>
          <strong className="text-gray-300">Flat deposit</strong>
          <br />
          $25-$50 for standard washes and interior cleans, $50-$100 for full
          details, paint correction, or ceramic coating jobs.
        </p>
        <p className={pClasses}>
          <strong className="text-gray-300">Percentage of the job</strong>
          <br />
          20-50% of the total price, applied toward the final bill at checkout.
        </p>
        <p className={pClasses}>
          A simple rule that works for most solo detailers:{' '}
          <strong className="text-gray-300">
            charge more deposit on higher-ticket jobs.
          </strong>{' '}
          A $60 wash doesn’t need the same commitment as a $400 ceramic coating
          appointment.
        </p>
        <p className={pClasses}>
          Whatever you choose, apply the deposit toward the final price —
          customers should never feel like they’re paying twice. With
          ServiceLink, you set the deposit amount once and it’s collected at
          checkout on your booking link every time.
        </p>
        <GuideProTip>
          Charge more deposit on higher-ticket jobs. A $60 wash doesn’t need the
          same commitment as a $400 ceramic coating appointment.{' '}
          <Link href={ROUTES.AUTH.SIGNUP} className={linkClasses}>
            Set your deposit on ServiceLink
          </Link>{' '}
          so customers pay when they book—not after you chase them.
        </GuideProTip>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>A Cancellation Policy You Can Copy Today</h2>
        <p className={pClasses}>
          You don’t need a lawyer to write this. Keep it short, put it on your
          booking page (or your ServiceLink page), and enforce it the same way
          every time.
        </p>
        <blockquote className={blockquoteClasses}>
          <p>
            <strong className="text-gray-300">Deposit Policy:</strong> A deposit
            is required to reserve your appointment. This deposit is applied
            toward your total service cost — it is not an additional fee.
          </p>
          <p>
            <strong className="text-gray-300">Cancellations:</strong> Cancel or
            reschedule more than 24 hours before your appointment and your
            deposit carries over to your new booking. Cancellations inside 24
            hours, or no-shows, forfeit the deposit.
          </p>
          <p>
            <strong className="text-gray-300">Access:</strong> Your vehicle must
            be present and accessible at the scheduled time. We’ll wait 15
            minutes past arrival before the appointment is marked a no-show.
          </p>
        </blockquote>
        <p className={pClasses}>
          Adjust the numbers to fit your business, but the structure — deposit
          required, 24-hour cutoff, forfeiture on no-show — is what most
          detailers converge on because it’s simple enough for customers to
          actually read and follow.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>Reminders: Your Second Line of Defense</h2>
        <p className={pClasses}>
          Deposits stop most no-shows. Reminders catch the rest — the customers
          who genuinely forgot, not the ones who never intended to show.
        </p>
        <p className={pClasses}>
          A text reminder sent the day before (and again a couple hours out)
          gives people a chance to reschedule instead of ghosting. Text has a
          huge advantage here: most people see a text within minutes, so a
          reminder actually lands before it’s too late to do anything about it.
        </p>
        <p className={pClasses}>
          The combination of{' '}
          <strong className="text-gray-300">deposit + reminder</strong> is what
          gets no-show rates down near zero. Deposits get people financially
          committed. Reminders keep them mentally on track.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>
          How to Set This Up Without Building It Yourself
        </h2>
        <p className={pClasses}>
          You don’t need a separate payment processor, a separate texting tool,
          and a spreadsheet to track who paid what. That’s exactly what
          ServiceLink handles on your booking link:
        </p>
        <ul className={listClasses}>
          <li>
            <strong className="text-gray-300">
              Deposits collected at booking
            </strong>{' '}
            — customers pay upfront when they pick their time, no chasing anyone
            down after the fact
          </li>
          <li>
            <strong className="text-gray-300">
              Applied automatically to the final price
            </strong>{' '}
            — no manual math, no awkward “so about that deposit” conversation
          </li>
          <li>
            <strong className="text-gray-300">
              Every booking saved to your client list
            </strong>{' '}
            — name, phone, email, and vehicle info captured automatically
          </li>
          <li>
            <strong className="text-gray-300">One link for everything</strong> —
            the same booking link you already share in your bio and texts now
            enforces your deposit policy for you
          </li>
        </ul>
        <p className={pClasses}>
          You set the policy once. ServiceLink enforces it on every booking
          after that.{' '}
          <Link href={ROUTES.AUTH.SIGNUP} className={linkClasses}>
            Create your free booking link
          </Link>{' '}
          and turn your policy into something customers actually see and follow
          — not just a paragraph they scroll past.
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
        <h2 className={h2Classes}>Final Thoughts</h2>
        <p className={pClasses}>
          No-shows aren’t bad luck — they’re a policy gap. The detailers who
          stay booked solid aren’t the ones with better customers. They’re the
          ones who made it slightly harder to blow off an appointment for free.
        </p>
        <p className={pClasses}>
          Write your policy, put a real deposit on it, and let your booking link
          enforce it every time.{' '}
          <Link href={ROUTES.AUTH.SIGNUP} className={linkClasses}>
            Get your free ServiceLink booking page
          </Link>{' '}
          and stop losing afternoons to people who were never going to show up.
        </p>
      </section>
    </>
  );
}
