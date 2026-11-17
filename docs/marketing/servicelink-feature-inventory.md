# ServiceLink feature inventory (blog / marketing)

**Audience:** anyone writing `/resources` guides, `/features` copy, or competitor comparisons.  
**Rule:** claim only what this file marks as verified. If a feature is not here, do not invent it.  
**Last audited in code:** 17 November 2026.

Pricing constants: `src/features/pricing/types.ts`. Plan bullets: `src/features/pricing/marketingPlanFeatures.ts`, `pricingComparisonRows.ts`. Dashboard nav: `src/features/dashboard/utils/dashboardNav.ts`. Team: `src/features/team/docs/TEAM_FEATURE.md`.

---

## Positioning (required)

ServiceLink is a **full detailing CRM and booking system**. It is as good as or better than the other detailing tools on the jobs that fill a shop—and simpler to use. It works for one operator and for a growing team (Team plan: up to 4 people).

Lead with **outcomes**: more bookings, fewer no-shows, more reviews, less admin.

Do **not** frame ServiceLink as a small, solo-only, or cheap-starter option. Do **not** write “built for solo.” Do **not** write “who X is built for” in a way that makes the competitor the grown-up choice. Do **not** list competitor extras we lack. Do **not** tell readers to stay on the other tool.

**Clear verdict on every comparison:** ServiceLink is the pick.

“Simple to use” is a **win** (ease of use), not a euphemism for “fewer features.” Price is **value** (full stack at $20 Pro / $60 Team), not “cheap because we’re small.”

Stay truthful. Team is **up to 4 people**. Do not claim unlimited seats, per-person calendars, route optimization, or Jobber-style 12-tech dispatch.

---

## Plans and prices

| Plan | List price                     | What you get                                                                                         | Source                                                                  |
| ---- | ------------------------------ | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Free | $0                             | 5 lifetime appointments, 5 services, 4 portfolio images, SMS/email on those 5, booking page stays up | `FREE_BOOKINGS_LIMIT`, `FREE_MAX_SERVICES`, `FREE_MAX_PORTFOLIO_IMAGES` |
| Pro  | **$20/month** or **$200/year** | Unlimited bookings and services, 8 portfolio images, payments and the Pro CRM                        | `PLANS.pro`, `PRO_YEARLY_LIST_PRICE`                                    |
| Team | **$60/month** or **$600/year** | Everything in Pro, **up to 4 people** on the shop, job assignment, teammates run jobs in the app     | `TEAM_*`, `TEAM_SEAT_LIMIT`                                             |

No trial for new signups. Free is how you start. Team shops still pass `isProAccess` for Pro gates. Grandfathered shops with `team_included` keep invites on their current price.

---

## Lead with these strengths

1. **Full detailing CRM + booking** — clients, vehicles, history, quotes, invoices, expenses, payments, reviews, marketing, in one app.
2. **Simple to use** — change prices, hours, and jobs without a field-service maze. Customers finish guest checkout on a phone.
3. **More bookings** — public booking page (`myservicelink.app/{slug}`), guest checkout, vehicle-size prices, sale banners, promo codes.
4. **Fewer no-shows** — deposits or full pay at checkout (Pro), confirmation SMS/email, day-before reminders.
5. **More reviews** — review request after every completed job (SMS first, email fallback); Google reviews imported onto the booking page.
6. **Less admin** — CRM fills in from every booking; quotes, invoices, receipts, Tap to Pay, expenses, memberships.
7. **Team-ready** — invite up to 4 people; Member / Coordinator / Manager roles; assign jobs; hires run the job in the iOS/Android app (on-the-way, pay, complete).
8. **Value** — try 5 appointments free; Pro $20/mo or $200/yr; Team $60/mo or $600/yr. Not “cheap starter”—full stack at a better price than $70–$199 recon/ops suites.

---

## Team (verified)

Evidence: `src/features/team/docs/TEAM_FEATURE.md`, `hasTeamAccess.ts`, `updateBookingAssignee.ts`, `notifyAssigneeForJobAssigned.ts`.

| Capability             | Detail                                                                                                                                                                                                                  | Plan                |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| Seats                  | Up to **4** people on the shop, including the owner                                                                                                                                                                     | Team                |
| Invite                 | Owner invites by email. 14-day token. Roles on the invite                                                                                                                                                               | Team                |
| Roles                  | **Member** (run jobs, take pay, change assignee), **Coordinator** (+ create/reschedule/cancel), **Manager** (+ customers, quotes, invoices, expenses, reviews, shop). Owner keeps billing, Stripe, team, account delete | Team                |
| Assignment             | `bookings.assigned_user_id`. Assign from the board. Filter “assigned to me.” Unassigned public bookings                                                                                                                 | Team                |
| Assigned notifications | Email + in-app + push to the assignee                                                                                                                                                                                   | Team                |
| Run the job            | On the way / started / finished / complete / Tap to Pay. Shop-wide `bookings.run` (not locked to assignee). Money lands on the owner’s Stripe                                                                           | Team + Pro payments |
| Overlap                | Two jobs at the same time allowed. **No per-person calendars.** Time off is shop closed                                                                                                                                 | Team                |
| Mobile                 | Teammates use the same iOS/Android app as the owner, with their role                                                                                                                                                    | Team                |

Do not claim: unlimited users, personal calendars, PTO per hire, capacity = headcount, route dispatch.

---

## Full inventory (plan + evidence)

### Public presence

| Feature                        | Plan                   | Evidence                                  |
| ------------------------------ | ---------------------- | ----------------------------------------- |
| Public booking / business page | Free after onboarding  | `[business-slug]/page.tsx`                |
| Custom slug                    | Free                   | Business profile                          |
| Service area                   | Free                   | `business-profile/`                       |
| Portfolio                      | Free 4 / Pro 8         | `FREE_MAX_PORTFOLIO_IMAGES`               |
| Sale banner                    | Pro                    | `loadPublicActiveSale.ts`                 |
| Link-view analytics            | Free 24h; Pro 7d / 30d | `analytics/constants.ts`                  |
| Spanish on the booking page    | Free (owner setting)   | `DashboardProfileBookingLanguageCard.tsx` |

### Scheduling and bookings

| Feature                            | Plan                                                  | Evidence                     |
| ---------------------------------- | ----------------------------------------------------- | ---------------------------- |
| Service catalog, add-ons, duration | Free (≤5 services)                                    | `src/features/services/`     |
| Vehicle-size / multi price options | **Pro**                                               | `priceOptionsAccess.ts`      |
| Availability, buffers, time off    | Free                                                  | `/dashboard/availability`    |
| Customer self-booking              | Free until 5-booking cap; deposits need **Pro** owner | `book/v2/`, booking-checkout |
| Calendar day/week/month/list       | Free                                                  | bookings dashboard           |
| ICS calendar sync                  | **Pro**                                               | `calendar-sync/`             |
| Job assignment                     | **Team**                                              | `BookingAssigneeField.tsx`   |

### CRM

| Feature                        | Plan | Evidence                                        |
| ------------------------------ | ---- | ----------------------------------------------- |
| Client list from bookings      | Free | `customer-management/`                          |
| Vehicles, notes, visit history | Free | customer detail + vehicles API                  |
| CSV import                     | Free | `importCustomers.ts`                            |
| Manual SMS snippets            | Free | Opens the phone SMS app — **not** an automation |

### Automations

| Feature                                         | Plan              | Evidence                          |
| ----------------------------------------------- | ----------------- | --------------------------------- |
| Booking confirmation SMS + email                | Free, on the 5    | `bookingSms.ts`                   |
| Day-before reminder (email + SMS + owner push)  | Follows bookings  | cron `booking-reminders`          |
| On the way / started / finished / completed SMS | Free/Pro          | `bookingSms.ts` (mobile)          |
| Reschedule / cancel notices                     | Free/Pro          | email + SMS                       |
| Owner new-booking email                         | Free/Pro          | booking notification emails       |
| Review request on complete                      | Not plan-gated    | `createReviewInviteIfEligible.ts` |
| Quote customer reminders                        | Pro               | cron `quote-customer-reminders`   |
| Membership visit reminders                      | Pro + memberships | `buildMembershipVisitReminderSms` |

No drip, abandoned-cart, or automated win-back sequence.

### Reviews

| Feature                         | Plan     | Say this                              | Do not say this                     |
| ------------------------------- | -------- | ------------------------------------- | ----------------------------------- |
| Review request after complete   | Free/Pro | “Review requests after every job”     | “We send a Google Maps review link” |
| ServiceLink review page         | Customer | Stars + comment                       |                                     |
| Inbox + owner reply             | Free     |                                       |                                     |
| Connect Google + import/display | Free/Pro | “Google reviews on your booking page” | “We post Google reviews for you”    |

### Money

| Feature                         | Plan                 | Evidence                                                             |
| ------------------------------- | -------------------- | -------------------------------------------------------------------- |
| Deposits / full pay at booking  | **Pro**              | booking-checkout                                                     |
| Revenue dashboard, transactions | **Pro**              | `/dashboard/payments`                                                |
| Tap to Pay (booking + walk-up)  | **Pro** + mobile app | tap-to-pay APIs                                                      |
| Walk-up payment link            | **Pro**              | `payments/walk-up/`                                                  |
| Quotes + public `/q/` pay       | **Pro**              | `src/features/quotes/`                                               |
| Invoices + `/b/` bills          | **Pro**              | `requireInvoicePro.ts`                                               |
| Receipts `/r/`                  | **Pro**              | job-completed invoice templates                                      |
| Expenses                        | **Pro**              | `requireExpensePro.ts` — supplies, fuel, equipment, insurance, other |
| Promo codes and sales           | **Pro**              | `src/features/marketing/`                                            |
| Customer memberships            | **Pro** + Connect    | `src/features/subscriptions/`                                        |
| Check-in SMS                    | **Pro**              | `CheckInProTeaserModalBody.tsx`                                      |

### Mobile apps

Owner and teammates: iOS `id6768877250`, Android `com.myservicelink.app`. Customers book on the **web** link.

---

## Do not claim

| Item                                        | Why                       |
| ------------------------------------------- | ------------------------- |
| Route optimization                          | Not in the app            |
| Win-back automations / drips                | Manual SMS snippet only   |
| Conditional photo uploads on booking        | Not in the flow           |
| Booking-link QR generator                   | App-download QR only      |
| Google Maps review texts                    | Review URL is ServiceLink |
| Unlimited team seats / per-person calendars | Cap 4; shop calendar only |
| VIN/dent estimating, QuickBooks, inventory  | Not the product           |

---

## Comparison table rows (ServiceLink should win)

- Ease of use
- Customer booking / bio link
- Automations (confirmations, reminders)
- Review requests + Google reviews on the page
- CRM (clients, vehicles, history)
- Deposits, Tap to Pay, quotes, invoices, expenses
- Team (up to 4, roles, assignment, mobile)
- Price / value (Free 5, Pro $20, Team $60)

Skip rows whose only job is to showcase a competitor extra we do not ship.

---

## Short plan copy

**Free:** booking page, calendar, CRM, review requests, Google reviews on the page, SMS/email on the first 5 appointments.

**Pro ($20/mo or $200/yr):** unlimited bookings, vehicle-size prices, deposits, Tap to Pay, quotes, invoices, receipts, expenses, sales, memberships, 7d/30d link views.

**Team ($60/mo or $600/yr):** Pro plus up to 4 people, roles, job assignment, teammates running jobs in the app.

Deposits require Pro. Do not imply Free shops can take card deposits.
