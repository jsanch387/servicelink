# Outline plan: Free-first pricing (no 7-day Pro trial), 5-booking cap, upgrade to unlock

**Status:** Onboarding free-trial path is **decommissioned in code** (route, flag, trial-ending email, checkout `trial_period_days` removed). Remaining items below are product/cap decisions, not trial activation.
**Goal:** New users land on **Free** (no Stripe trial). They can run the product with **five booking slots** (see **product decision** below), then must **upgrade to Pro** to accept more public bookings, create owner-side appointments/quotes as required, and use Pro-only surfaces. Remove the **7-day Pro trial** path that today ties onboarding to Stripe `trialing`.

---

## Product decisions to lock before engineering

1. **Five bookings — monthly vs lifetime**  
   **Today in code:** `FREE_BOOKINGS_LIMIT = 5` with a **calendar month** reset (`business_profiles.free_bookings_month` + `free_bookings_count`). Same logic in `enforceFreeTierBookingCapBeforeCreate` and the public `book/page.tsx` “not accepting” UI.  
   **Your wording** sounded like **five total** (lifetime). If product wants lifetime, we change persistence and copy everywhere (not just messaging).

2. **What exactly is blocked at cap (Free)**  
   Confirm list: e.g. public availability booking only vs also **owner manual** `POST /api/public/bookings` with `ownerManualBooking`, **legacy booking request** form, **quote request intake**, **owner quote compose/send**, **maintenance** enrollments, etc. Some paths already differ (quotes are largely **Pro-gated** for intake; booking cap is separate).

3. **Churned trial / canceled paid users vs “never paid” Free**  
   Today **`hasStripeBillingHistory`** drives **middleware**: users who ever had Stripe customer/subscription history but are **not** `isProAccess` get redirected to **`/dashboard/upgrade`** (no full dashboard). **Grandfathered free** = no Stripe history, stays in app.  
   After removing trial, **new** users should stay “no history” Free until they subscribe — align onboarding + default profile rows so we do not accidentally create Stripe customers before pay.

4. **Public marketing profile visibility**  
   **`isPublicBusinessProfileLive`** (`publicBusinessSlugVisibility.ts`): churned Pro (Stripe history + not Pro) → public slug can be **hidden**. Free never-paid stays live. Revisit if “free at cap” should still show profile with “upgrade to book” vs hard `notFound`.

---

## What we already have (reuse)

| Area                                | Where                                                                                 | Notes                                                                                                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cap constant**                    | `src/features/pricing/types.ts` — `FREE_BOOKINGS_LIMIT = 5`                           | Used by tracker + enforcement.                                                                                                                              |
| **Server enforcement (bookings)**   | `enforceFreeTierBookingCapBeforeCreate` in `enforceFreeTierBookingCapBeforeCreate.ts` | Runs on **`POST /api/public/bookings`** before insert; increments month counter when allowed. Uses **`isProAccess`** on owner profile — Pro users skip cap. |
| **Check-only + deferred increment** | `checkFreeTierBookingCapAllowsCreate`, `persistFreeTierBookingIncrementAfterBooking`  | Used by **quote → booking** approval so cap matches booking creation.                                                                                       |
| **Public book UI**                  | `src/app/[business-slug]/book/page.tsx`                                               | Computes `reachedFreeCap` (month + count ≥ 5 for free tier), forces **not accepting** / hides calendar.                                                     |
| **Free bookings UI (dashboard)**    | `FreeBookingsTracker.tsx`, `dashboard/bookings/page.tsx`                              | Shows **used / 5** for owners.                                                                                                                              |
| **Pro gate helper**                 | `isProAccess` (`isProAccess.ts`)                                                      | Single source for “has Pro entitlement.”                                                                                                                    |
| **Middleware paywall**              | `src/middleware.ts`                                                                   | Stripe history + not Pro → `/dashboard/upgrade`.                                                                                                            |
| **Docs: feature matrix**            | `docs/subscription-and-pro-features.md`                                               | Lists Free vs Pro; already documents **5/month** booking cap — update when product decides.                                                                 |
| **Marketing copy**                  | `marketingPlanFeatures.ts` — “5 bookings per month”                                   | Align with final product wording.                                                                                                                           |

---

## What today still assumes a 7-day / Stripe trial (remove or replace)

| Area                       | Examples                                                                                                                                          | Direction                                                                                                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Onboarding step 5**      | Stripe Checkout with `trial_period_days: 7`, `start-onboarding-trial`, `confirm-onboarding-trial`, webhook branches for `onboarding_trial_bridge` | Replace with **“complete onboarding without Pro”** (or optional “upgrade later”) — profile stays **free**, no `trialing` subscription unless they go to paywall checkout. |
| **Mobile + web contracts** | `docs/contracts/mobile-onboarding-stripe-checkout.md`, Stripe README sections                                                                     | Rewrite or deprecate when flow is final.                                                                                                                                  |
| **UI**                     | `PlanSection` “Pro trial”, onboarding CTAs, `trial_confirmation` payloads                                                                         | Copy + state machine for “Free until upgrade.”                                                                                                                            |
| **Emails**                 | Trial ending soon (`trial_will_end` webhook)                                                                                                      | Keep only if paid trials still exist for some cohort; else remove/disable.                                                                                                |

---

## Gaps / extensions vs your target (“no bookings / quotes unless upgrade”)

| Gap                                           | Detail                                                                                                                                                                                                |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cap is booking-centric today**              | Quote **intake** is mostly **Pro + toggle** (`publicQuoteRequestAllowedForSlug`), not the **5 booking** counter. If you want “no quote requests on free at cap,” that is **new** product + API rules. |
| **Legacy `POST /api/booking-request/submit`** | Does **not** use `enforceFreeTierBookingCapBeforeCreate` in a quick grep — confirm if legacy funnel should count toward the same 5 or stay separate/disabled.                                         |
| **Owner dashboard create appointment**        | Uses same **`POST /api/public/bookings`** — already under cap. Good.                                                                                                                                  |
| **Stripe booking checkout (customer pays)**   | Separate path (`booking-checkout` + webhook); confirm whether completing a paid booking should increment the same counter (today public POST path increments via `enforceFreeTier…`).                 |
| **Maintenance / other booking-like flows**    | `persistFreeTierBookingIncrementAfterBooking` on maintenance — align with policy.                                                                                                                     |

---

## Suggested implementation phases (when you build)

1. **Product + data model** — Confirm monthly vs lifetime 5; list every user action to block at cap vs block for all Free.
2. **Signup + onboarding** — Default `profiles` / `business_profiles` to Free; complete onboarding **without** creating Stripe trial; ensure no accidental `stripe_customer_id` until user hits upgrade.
3. **Remove trial code paths** — Checkout trial metadata, silent trial API, webhook special-cases, middleware edge cases for “trial only” users.
4. **Unify enforcement** — One helper (or thin wrappers) for “may this business accept another booking-like event?” and call from every server entry point you care about.
5. **UI copy** — Public “not accepting,” dashboard banners, upgrade page, mobile parity.
6. **Docs + tests** — Update `subscription-and-pro-features.md`, pricing tests, middleware tests, booking cap tests.

---

## Quick “where are we today?” summary

- **Five free bookings (cap logic):** **Implemented** — server + public book page + dashboard tracker; tied to **monthly** reset, not necessarily “five ever.”
- **Block public booking at cap:** **Implemented** for availability POST + UI.
- **No 7-day trial / free-first signup:** **Not** the current primary path — onboarding still centers Stripe trial / Pro activation.
- **Block entire app for expired trial:** **Partially** — middleware blocks dashboard for **Stripe history + not Pro**; different from “five bookings used” on a never-paid Free account.

Use this doc to sequence work and to resolve the **monthly vs lifetime** five bookings question first — it drives DB shape and all user-facing copy.
