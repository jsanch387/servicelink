import Link from 'next/link';
import { ROUTES } from '@/constants/routes';

const sectionClasses = 'mb-10';
const h2Classes = 'text-xl sm:text-2xl font-bold text-white mt-10 mb-4';
const h3Classes = 'text-lg font-semibold text-white mt-6 mb-3';
const pClasses = 'text-gray-400 leading-relaxed mb-4';
const listClasses = 'list-disc list-inside space-y-2 text-gray-400 mb-4 ml-2';
const linkClasses =
  'text-gray-300 underline hover:text-white transition-colors';

export function HowMobileDetailersGetClientsInstagramContent() {
  return (
    <>
      <p className={pClasses}>
        If you’re a mobile car detailer, Instagram and TikTok can bring you a
        lot of customers.
      </p>
      <p className={pClasses}>
        Many detailers are getting new bookings every week just from posting
        videos.
      </p>
      <p className={pClasses}>
        The good news? You don’t need a big following. You just need to post the
        the t kind of content and make it easy for people to book you.
      </p>
      <p className={pClasses}>In this guide you will learn:</p>
      <ul className={listClasses}>
        <li>How detailers get clients from social media</li>
        <li>What type of videos work best</li>
        <li>How to get local customers to find you</li>
        <li>How to turn viewers into paying customers</li>
      </ul>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>Why Detailing Videos Work So Well</h2>
        <p className={pClasses}>
          People love watching cleaning videos. They are satisfying. They show
          big transformations. A dirty car turning into a clean car grabs
          attention fast.
        </p>
        <p className={pClasses}>
          That’s why car detailing videos do very well on Instagram and TikTok.
        </p>
        <p className={pClasses}>Common videos that get views:</p>
        <ul className={listClasses}>
          <li>Dirty interiors being vacuumed</li>
          <li>Carpet shampoo transformations</li>
          <li>Foam cannon car washes</li>
          <li>Before and after detailing clips</li>
        </ul>
        <p className={pClasses}>The key is showing the transformation.</p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>
          5 Types of Detailing Videos That Get Customers
        </h2>
        <p className={pClasses}>
          You don’t need fancy editing. Simple videos work best. Here are some
          ideas you can post.
        </p>

        <h3 className={h3Classes}>1. Before and After Videos</h3>
        <p className={pClasses}>
          Show the car before you start. Then show the finished result. People
          love seeing the difference.
        </p>
        <p className={pClasses}>
          <strong className="text-gray-300">Example title:</strong>
          <br />
          “Interior detail transformation in Austin Texas”
        </p>

        <h3 className={h3Classes}>2. “Come With Me” Videos</h3>
        <p className={pClasses}>
          These videos feel personal and real. Example: “Come with me to detail
          a car in Dallas”
        </p>
        <p className={pClasses}>Show:</p>
        <ul className={listClasses}>
          <li>arriving at the house</li>
          <li>the dirty car</li>
          <li>the cleaning process</li>
          <li>the final result</li>
        </ul>

        <h3 className={h3Classes}>3. Customer Reaction Videos</h3>
        <p className={pClasses}>
          Customers reacting to their clean car are powerful. It builds trust
          with viewers. People think: “Wow, I want my car to look like that
          too.”
        </p>

        <h3 className={h3Classes}>4. Satisfying Cleaning Clips</h3>
        <p className={pClasses}>
          These short clips perform very well. Examples:
        </p>
        <ul className={listClasses}>
          <li>pressure washing floor mats</li>
          <li>vacuuming crumbs</li>
          <li>extracting dirty water from carpets</li>
        </ul>
        <p className={pClasses}>
          These clips are perfect for TikTok and Instagram Reels.
        </p>

        <h3 className={h3Classes}>5. Problem-Solution Videos</h3>
        <p className={pClasses}>
          Example: “This car hasn’t been cleaned in 5 years.” Then show the
          process of restoring it. These videos hook viewers fast.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>Always Mention Your City</h2>
        <p className={pClasses}>
          This is very important. You want local customers to find you.
        </p>
        <p className={pClasses}>
          In your video say something like: “Today we are detailing a car in
          Austin Texas.”
        </p>{' '}
        <p className={pClasses}>
          Also include your city in the caption.{' '}
          <strong className="text-gray-300">Example caption:</strong>
        </p>
        <p
          className={`${pClasses} bg-neutral-800/50 border border-neutral-700 rounded-lg p-4 text-gray-300`}
        >
          Mobile car detailing in Austin Texas
          <br />
          Interior detail transformation
        </p>
        <p className={pClasses}>
          This helps people in your area find your videos.
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>Post Consistently</h2>
        <p className={pClasses}>
          You don’t need to post every day. But try to post 3 to 4 videos per
          week. More posts = more chances for people to discover your work.
        </p>
        <p className={pClasses}>Most successful detailers keep their videos:</p>
        <ul className={listClasses}>
          <li>simple</li>
          <li>real</li>
          <li>consistent</li>
        </ul>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>Turn Views Into Customers</h2>
        <p className={pClasses}>
          Getting views is great. But the real goal is getting bookings. When
          someone likes your work they will visit your profile.
        </p>
        <p className={pClasses}>Your profile should have:</p>
        <ul className={listClasses}>
          <li>photos of your work</li>
          <li>clear service information</li>
          <li>an easy way to book</li>
        </ul>
        <p className={pClasses}>
          This is why many detailers use a booking link in their bio. Instead of
          answering many DMs, customers can simply click the link and book your
          service.{' '}
          <Link href="/" className={linkClasses}>
            Get a free booking link here
          </Link>
          .
        </p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>Make Booking Easy</h2>
        <p className={pClasses}>
          If someone wants your service, don’t make them work for it. The easier
          it is to book you, the more customers you will get.
        </p>
        <p className={pClasses}>A simple booking page should show:</p>
        <ul className={listClasses}>
          <li>your services</li>
          <li>your pricing</li>
          <li>photos of your work</li>
          <li>available booking times</li>
        </ul>
        <p className={pClasses}>
          Tools like{' '}
          <Link href="/" className={linkClasses}>
            ServiceLink
          </Link>{' '}
          help detailers create a simple booking page they can place in their
          bio. When customers click your link they can quickly:
        </p>
        <ul className={listClasses}>
          <li>see your services</li>
          <li>view your work</li>
          <li>book an appointment</li>
        </ul>
        <p className={pClasses}>
          No long conversations in DMs. Just simple booking.{' '}
          <Link href="/" className={linkClasses}>
            Get your free booking page here
          </Link>
          . Not sure which tool to use? Read our guide on the{' '}
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
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>Simple Example</h2>
        <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-6 my-6">
          <ol className="flex flex-col gap-0" aria-label="Booking flow">
            <li className="flex items-center gap-4 py-3 first:pt-0">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-700 text-sm font-semibold text-white">
                1
              </span>
              <span className="text-gray-300 font-medium">
                Customer sees your video
              </span>
            </li>
            <li className="flex items-center gap-4 py-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-700 text-sm font-semibold text-white">
                2
              </span>
              <span className="text-gray-300 font-medium">
                They visit your Instagram profile
              </span>
            </li>
            <li className="flex items-center gap-4 py-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-700 text-sm font-semibold text-white">
                3
              </span>
              <span className="text-gray-300 font-medium">
                They click your link
              </span>
            </li>
            <li className="flex items-center gap-4 py-3 last:pb-0">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-700 text-sm font-semibold text-white">
                4
              </span>
              <span className="text-gray-300 font-medium">
                They book your service
              </span>
            </li>
          </ol>
        </div>
        <p className={pClasses}>That’s the goal.</p>
      </section>

      <section className={sectionClasses}>
        <h2 className={h2Classes}>Final Thoughts</h2>
        <p className={pClasses}>
          Social media is one of the best ways for mobile detailers to get
          customers today. You don’t need expensive ads. You just need to:
        </p>
        <ul className={listClasses}>
          <li>post satisfying detailing videos</li>
          <li>mention your city</li>
          <li>show before and after results</li>
          <li>
            make booking simple (
            <Link href="/" className={linkClasses}>
              get a free booking link here
            </Link>
            )
          </li>
        </ul>
        <p className={pClasses}>
          Over time your content can bring a steady flow of local customers.
          Start posting your work, stay consistent, and make it easy for
          customers to book you with a simple link in your bio.
        </p>
      </section>
    </>
  );
}
