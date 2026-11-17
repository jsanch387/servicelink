# ServiceLink feature inventory (blog / marketing)

**Audience:** anyone writing `/resources` guides, `/features` copy, or competitor comparisons.  
**Rule:** claim only what this file marks as verified. If a feature is not here, do not invent it.  
**Last audited in code:** 17 November 2026, branch `cursor/blog-seo-restart-e520`.

Pricing constants live in `src/features/pricing/types.ts`. Plan bullets live in `src/features/pricing/marketingPlanFeatures.ts` and `src/features/pricing/pricingComparisonRows.ts`. Dashboard nav lives in `src/features/dashboard/utils/dashboardNav.ts`.

---

## Positioning (required for comparison posts)

ServiceLink is the better app for **solo and small mobile detailers**. Stay helpful and honest. Never write a “things competitors do that ServiceLink doesn’t” list. Never write a “stay on X” section.

Use this frame instead:

- **Who the other tool is built for** (bigger shops, PPF/tint/PDR estimating, multi-trade crews).
- **Why solo mobile detailers pick ServiceLink** (booking link, automations, Google reviews on the page, sleek UI, free start then $20).

Comparison tables should use **rows where ServiceLink is strong**. Do not pad tables with competitor extras we do not sell. Do not say a competitor lacks a feature unless you verified it on their current public site, and cite the month.

---

## Plans and prices

| Plan | List price                     | Caps / seats                                                                                                                | Source                                                                  |
| ---- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Free | $0                             | 5 lifetime appointments, 5 services, 4 portfolio images, SMS/email on those 5 bookings, booking page stays up after the cap | `FREE_BOOKINGS_LIMIT`, `FREE_MAX_SERVICES`, `FREE_MAX_PORTFOLIO_IMAGES` |
| Pro  | **$20/month** or **$200/year** | Unlimited bookings and services, 8 portfolio images, payments and Pro tools                                                 | `PLANS.pro`, `PRO_YEARLY_LIST_PRICE`                                    |
| Team | **$60/month** or **$600/year** | Everything in Pro, up to **4** people on the shop                                                                           | `TEAM_*`, `TEAM_SEAT_LIMIT`                                             |

There is no trial for new signups. Free is the try-it path. Team is a separate Stripe plan; Team shops still pass `isProAccess` for Pro feature gates.

---

## Blog-safe strengths (lead with these)

These are the claims comparison posts should open with. All are in the product.

1. **Built for solo mobile detailers** — booking page, calendar, CRM, and payments in one lean app.
2. **Free to start, then $20** — first 5 appointments free; Pro $20/mo or $200/yr.
3. **Public booking / bio page** — `myservicelink.app/{slug}`, guest checkout, no customer app.
4. **Sleek, simple UI** — phone-sized dashboard you can run between jobs.
5. **CRM that fills in from bookings** — clients, vehicles, visit history, notes, CSV import.
6. **Vehicle-size pricing (Pro)** — sedan / SUV / truck (or other options) on one service.
7. **Deposits, card payments, Tap to Pay (Pro)** — checkout deposits plus Tap to Pay in the iOS/Android app.
8. **Automations** — booking confirmation SMS/email, day-before reminders, on-the-way / job-started / finished / completed texts, quote reminders.
9. **Review requests after every completed job** — SMS-first, email fallback, to the ServiceLink review page. Receipts can include the same ask.
10. **Google reviews on the booking page** — connect Google Business Profile, import reviews, show them next to ServiceLink reviews.
11. **Quotes, invoices, receipts (Pro)** — send quotes, collect on a public link, send invoices, branded receipts (`/r/` and `/b/` links).
12. **Expense tracking (Pro)** — supplies, fuel, equipment, insurance, other. Month and year totals.
13. **Sales and promo codes (Pro)** — one live sale banner; promo codes at booking.
14. **Native iOS and Android apps** — owner apps (App Store / Play). Customers still book on the web link.
15. **Service area** — city/state + radius on the public page.
16. **Availability, buffers, time off** — customers only see open slots.
17. **Subscriptions for repeat clients (Pro)** — membership plans on the public `/subscribe` page.
18. **Team (Team plan)** — invite up to 4 people, assign jobs from the board.

---

## Full inventory (plan + evidence)

### Public presence

| Feature                          | Plan                                    | Evidence                                                           | Blog note                                                      |
| -------------------------------- | --------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------- |
| Public business / booking page   | Free (live after onboarding)            | `src/app/[business-slug]/page.tsx`, `publicBusinessProfileLive.ts` | Call it the booking link or bio page                           |
| Custom slug                      | Free                                    | Business profile                                                   | `myservicelink.app/yourname`                                   |
| Service area (city/state/radius) | Free                                    | `business-profile/`                                                |                                                                |
| Portfolio / cover photos         | Free 4 / Pro 8                          | `FREE_MAX_PORTFOLIO_IMAGES`, `PRO_MAX_PORTFOLIO_IMAGES`            |                                                                |
| Verified badge                   | Pro                                     | `[business-slug]/page.tsx`                                         | Optional; not a headline                                       |
| Active sale banner               | Pro                                     | `loadPublicActiveSale.ts`                                          |                                                                |
| Link-view analytics              | Free: 24h. Pro: 7d / 30d                | `src/features/analytics/constants.ts`                              |                                                                |
| App-download QR                  | Free (owner onboarding / get-app modal) | `GetAppModal.tsx`                                                  | This QR is for the **owner app**, not a booking-link generator |

### Services and scheduling

| Feature                                        | Plan                                                        | Evidence                                          |
| ---------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------- |
| Service catalog, categories, add-ons, duration | Free (≤5 services)                                          | `src/features/services/`                          |
| Multiple price options (vehicle size)          | **Pro**                                                     | `priceOptionsAccess.ts`, pricing comparison table |
| Weekly availability                            | Free                                                        | `/dashboard/availability`                         |
| Buffer time between jobs                       | Free                                                        | booking calendar                                  |
| Time-off blocks                                | Free                                                        | booking calendar                                  |
| Customer self-booking (V2)                     | Free until the 5-booking cap; deposits need a **Pro** owner | `book/v2/`, `booking-checkout`                    |
| Owner-created appointments                     | Free (same cap)                                             | `/dashboard/bookings/new`                         |
| Calendar (day / week / month / list)           | Free                                                        | bookings dashboard                                |
| ICS calendar sync                              | **Pro**                                                     | `calendar-sync/`                                  |
| Booking assignee                               | **Team**                                                    | `updateBookingAssignee.ts`                        |

### CRM

| Feature                                              | Plan | Evidence                                                                    |
| ---------------------------------------------------- | ---- | --------------------------------------------------------------------------- |
| Client list from bookings                            | Free | `src/features/customer-management/`                                         |
| Vehicles per customer                                | Free | `/api/customers/.../vehicles`                                               |
| Notes and visit history                              | Free | customer detail                                                             |
| CSV import (names, numbers, vehicles)                | Free | `importCustomers.ts`                                                        |
| Manual SMS templates, including a “win back” snippet | Free | `useCustomerManagement.ts` — **opens the phone SMS app**. Not an automation |

### Automations and messages

| Feature                                                  | Plan                               | Evidence                                     |
| -------------------------------------------------------- | ---------------------------------- | -------------------------------------------- |
| Booking confirmation email + SMS                         | Free, on the 5 bookings            | `bookingSms.ts`, availability booking emails |
| Day-before reminder (email + SMS + owner push)           | Free/Pro (volume follows bookings) | cron `booking-reminders`                     |
| On the way / job started / work finished / completed SMS | Free/Pro                           | `bookingSms.ts` (mainly from the mobile app) |
| Reschedule / cancel notices                              | Free/Pro                           | email + SMS templates                        |
| Owner new-booking email                                  | Free/Pro                           | booking notification emails                  |
| Quote customer reminders (2–3 days)                      | Pro shops sending quotes           | cron `quote-customer-reminders`              |
| Quote-request owner follow-up                            | Pro                                | cron `quote-request-follow-ups`              |
| Membership visit reminders                               | Pro + memberships                  | `buildMembershipVisitReminderSms`            |

There is **no** drip campaign, abandoned-cart series, or automated win-back sequence. Do not call the manual SMS snippet a win-back automation.

### Reviews

| Feature                                   | Plan                      | Evidence                                                   | Say this                                                      | Do not say this                                        |
| ----------------------------------------- | ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------ |
| Review request after job complete         | Free/Pro (not plan-gated) | `createReviewInviteIfEligible.ts`, `buildReviewRequestSms` | “Review requests after every job” (SMS first, email fallback) | “We email them a Google review link”                   |
| ServiceLink review page `/review/[token]` | Customer                  | public review submit                                       | Stars + comment on your ServiceLink page                      |                                                        |
| Owner reviews inbox + reply               | Free                      | `/dashboard/reviews`                                       |                                                               |                                                        |
| Connect Google Business Profile           | Free/Pro                  | `reviews/google-connect/`                                  | “Connect Google and show Google reviews on your booking page” | “ServiceLink posts or requests Google reviews for you” |
| Import / display Google reviews           | Free/Pro                  | `google_reviews` table, public profile Reviews tab         |                                                               |                                                        |

Review invites go to **ServiceLink’s** review URL. Google reviews are **imported and displayed**. Those are two different products. Both are real. Do not merge them into “Google review request emails.”

### Payments, quotes, invoices, expenses

| Feature                                                              | Plan                                                                      | Evidence                                                            |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Stripe Connect, deposits, full pay at booking                        | **Pro**                                                                   | `api/public/booking-checkout`                                       |
| Payments / revenue dashboard                                         | **Pro**                                                                   | `/dashboard/payments`                                               |
| Tap to Pay (booking and walk-up)                                     | **Pro** + mobile app                                                      | `api/payments/tap-to-pay/`, `docs/contracts/mobile-*-tap-to-pay.md` |
| Walk-up payment link                                                 | **Pro**                                                                   | `payments/walk-up/`                                                 |
| Quotes (create, send, `/q/` link)                                    | Market as **Pro**. Card collection and public quote **requests** are Pro. | `src/features/quotes/`                                              |
| Invoices (create, send, PDF, `/b/` bill link)                        | **Pro**                                                                   | `requireInvoicePro.ts`                                              |
| Branded receipts (`/r/` short links, job-complete receipt email/SMS) | **Pro** (tied to payments)                                                | `jobCompletedInvoiceTemplate.ts`                                    |
| Expenses (CRUD, categories, month/year totals)                       | **Pro**                                                                   | `requireExpensePro.ts`, `/dashboard/expenses`                       |
| Promo codes and sales                                                | **Pro** (public redemption checks Pro)                                    | `src/features/marketing/`                                           |
| Customer memberships / subscriptions                                 | **Pro** + Connect                                                         | `src/features/subscriptions/`                                       |

Expense categories in code: `supplies`, `fuel`, `equipment`, `insurance`, `other`. There is no receipt-image upload on an expense row.

### Mobile apps

iOS: `https://apps.apple.com/us/app/servicelink-for-business/id6768877250`  
Android: `https://play.google.com/store/apps/details?id=com.myservicelink.app`

Customers book on the **web** booking link. The native apps are for the shop.

### Team

Team plan: up to 4 people, assign work, teammates run jobs in the app. Roles: Member / Coordinator / Manager. See `src/features/team/docs/TEAM_FEATURE.md`.

---

## Do not claim (verified absent, or easy to overclaim)

| Item                                                          | Why                                                |
| ------------------------------------------------------------- | -------------------------------------------------- |
| Route optimization / route sorting                            | Not in the app                                     |
| Win-back **automations** / email drips / abandoned-cart flows | Manual SMS template only                           |
| Conditional photo uploads on booking                          | Not in the booking flow                            |
| Booking-link QR generator                                     | Only an **app-download** QR exists (`GetAppModal`) |
| Automatic “leave us a Google review” texts that open Maps     | Review invites use the ServiceLink review URL      |
| Inventory, dispatch suite, VIN/dent estimating, QuickBooks    | Not ServiceLink’s product                          |
| PWA                                                           | No web app manifest                                |

If a competitor sells one of those, **do not mention it** in a comparison. Talk about ServiceLink’s booking link, automations, reviews, UI, and price instead.

---

## Free vs Pro (short copy)

**Free:** booking page, calendar, up to 5 services, client list, vehicles, review requests, Google review display, SMS/email on the first 5 appointments.

**Pro ($20/mo or $200/yr):** unlimited bookings and services, vehicle-size prices, deposits, Tap to Pay, quotes, invoices, receipts, expenses, sales/promos, memberships, calendar sync, 7d/30d link views.

**Team ($60/mo or $600/yr):** Pro plus up to 4 people and job assignment.

Deposits, Tap to Pay, invoices, quote card collection, expenses, sales, and memberships require Pro. Do not imply a Free shop can take deposits.

---

## How to use this in a comparison table

Prefer rows like:

- Price (Free 5, then $20)
- Public booking / bio link
- Vehicle-size pricing
- Deposits + Tap to Pay
- CRM (clients, vehicles, history)
- SMS confirmations and reminders
- Review requests
- Google reviews on the page
- Expenses
- Quotes and invoices
- Native mobile apps
- Built for (solo mobile detailers vs recon shop vs field-service crew)

Skip rows whose only purpose is to show a competitor extra we do not ship.
