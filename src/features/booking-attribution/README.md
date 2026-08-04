# Booking attribution

Answers one question: **did this booking come from the `/find-detailers` marketplace, or did the customer find the detailer directly?**

## How it works

1. **Tag the link.** Marketplace result cards link to `/{slug}?ref=marketplace` via `getPublicBusinessProfilePath(slug, { ref })`. The query key lives in `constants/routes.ts` as `BOOKING_REFERRAL_QUERY`.
2. **Capture in middleware.** `bookingReferralCaptureRedirect` turns a valid `?ref=` into the `sl_booking_ref` cookie and redirects to the same URL without the param, so the profile URL people see and share stays clean.
3. **Read at booking time.** The booking APIs call `bookingReferralSourceForBusiness(request, businessSlug)` and persist the result.

The cookie is needed because booking spans several pages (profile → service details → calendar → confirm, plus a round trip to Stripe), so the original query param is long gone by the time a row is written.

## Cookie

|          |                                                              |
| -------- | ------------------------------------------------------------ |
| Name     | `sl_booking_ref`                                             |
| Value    | `<source>:<business-slug>`, e.g. `marketplace:acme-auto`     |
| Lifetime | 30 days                                                      |
| Flags    | `httpOnly`, `sameSite=lax`, `secure` in production, `path=/` |

The slug is part of the value so that browsing one detailer on the marketplace can never credit a booking the customer later makes with a different detailer.

## Why marketplace cards set `prefetch={false}`

Capture happens in middleware, and Next strips the `RSC` / `Next-Router-Prefetch` headers before middleware runs — a prefetch is indistinguishable from a real click there. With viewport prefetching on, every card on screen would write the cookie. Disabling prefetch on those links keeps the cookie tied to the card the customer actually opened.

## Where it lands

| Flow                        | Table                              | Written by                                                                                       |
| --------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------ |
| V2 booking, no card payment | `bookings.referral_source`         | `POST /api/public/bookings`                                                                      |
| V2 booking, Stripe checkout | `bookings.referral_source`         | `/api/public/booking-checkout` stores it on the draft payload; the Stripe webhook writes the row |
| V1 booking request          | `booking_requests.referral_source` | `POST /api/booking-request/submit`                                                               |

Owner-created bookings (`?for=owner`) are always null — the owner booking on a customer's behalf is not an acquisition channel.

## Trust

Values are validated against `BOOKING_REFERRAL_SOURCES`; anything else is discarded. Attribution is never read from a request body, only from the server-set cookie, so a client cannot label its own booking.

## Adding a channel

Add the value to `BOOKING_REFERRAL_SOURCES` and pass it as `ref` on the links for that channel. Nothing else changes — the column is free-form text.

## Reporting

```sql
select referral_source, count(*)
from bookings
where created_at >= now() - interval '30 days'
group by referral_source;
```
