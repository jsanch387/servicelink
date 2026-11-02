# Booking origin

Two server-set columns on `bookings` answer **how this appointment was created** and, for public bookings, **how the customer found the business**.

| Column            | Meaning                                                        | Values                                                  |
| ----------------- | -------------------------------------------------------------- | ------------------------------------------------------- |
| `booking_source`  | Creation flow. Required on every new insert.                   | `owner`, `public`, `quote`, `subscription` (null = old) |
| `referral_source` | How the customer found the business. Survives quote → booking. | `marketplace` or null (direct)                          |

Marketplace is **not** a `booking_source`. Search → find-detailers → book is `public` + `marketplace`. Search → find-detailers → request quote → accept is `quote` + `marketplace`.

## `booking_source`

| Value          | When                                                       |
| -------------- | ---------------------------------------------------------- |
| `owner`        | Owner created the appointment from the dashboard / app.    |
| `public`       | Customer booked themselves on `/{slug}` or `/{slug}/book`. |
| `quote`        | Customer accepted a quote and we created the appointment.  |
| `subscription` | Membership / subscription visit (initial or period).       |

Set only in `createBooking` / `createBookingForExistingCustomer`. Never accept it from a request body.

## Marketplace referral (`referral_source`)

Answers: **did this public booking come from `/find-detailers`, or did the customer find the detailer directly?**

1. **Tag the link.** Marketplace result cards link to `/{slug}?ref=marketplace` via `getPublicBusinessProfilePath(slug, { ref })`. The query key lives in `constants/routes.ts` as `BOOKING_REFERRAL_QUERY`.
2. **Capture in middleware.** `bookingReferralCaptureRedirect` turns a valid `?ref=` into the `sl_booking_ref` cookie and redirects to the same URL without the param, so the profile URL people see and share stays clean.
3. **Read at booking time.** The booking APIs call `bookingReferralSourceForBusiness(request, businessSlug)` and persist the result.

The cookie is needed because booking spans several pages (profile → service details → calendar → confirm, plus a round trip to Stripe), so the original query param is long gone by the time a row is written.

### Cookie

|          |                                                              |
| -------- | ------------------------------------------------------------ |
| Name     | `sl_booking_ref`                                             |
| Value    | `<source>:<business-slug>`, e.g. `marketplace:acme-auto`     |
| Lifetime | 30 days                                                      |
| Flags    | `httpOnly`, `sameSite=lax`, `secure` in production, `path=/` |

The slug is part of the value so that browsing one detailer on the marketplace can never credit a booking the customer later makes with a different detailer.

### Why marketplace cards set `prefetch={false}`

Capture happens in middleware, and Next strips the `RSC` / `Next-Router-Prefetch` headers before middleware runs — a prefetch is indistinguishable from a real click there. With viewport prefetching on, every card on screen would write the cookie. Disabling prefetch on those links keeps the cookie tied to the card the customer actually opened.

### Where referral lands

| Flow                        | Table                              | Written by                                                                                       |
| --------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------ |
| V2 booking, no card payment | `bookings.referral_source`         | `POST /api/public/bookings`                                                                      |
| V2 booking, Stripe checkout | `bookings.referral_source`         | `/api/public/booking-checkout` stores it on the draft payload; the Stripe webhook writes the row |
| Public quote request        | `quotes.referral_source`           | `POST /api/public/quote-request`; copied to the booking when the quote is accepted               |
| V1 booking request          | `booking_requests.referral_source` | `POST /api/booking-request/submit`                                                               |

Owner-created bookings (`?for=owner`) are always null — the owner booking on a customer's behalf is not an acquisition channel.

Public quote requests (`POST /api/public/quote-request`) store the same cookie on `quotes.referral_source`. When the customer accepts, `createBookingFromApprovedQuote` copies it onto the appointment so we still know they came from the marketplace even though `booking_source` is `quote`.

### Trust

Values are validated against `BOOKING_REFERRAL_SOURCES`; anything else is discarded. Attribution is never read from a request body, only from the server-set cookie, so a client cannot label its own booking.

### Adding a referral channel

Add the value to `BOOKING_REFERRAL_SOURCES` and pass it as `ref` on the links for that channel.

## Reporting

```sql
select booking_source, referral_source, count(*)
from bookings
where created_at >= now() - interval '30 days'
group by 1, 2
order by 3 desc;
```
