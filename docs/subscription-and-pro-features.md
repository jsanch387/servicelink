# Subscription, billing, and Pro features

This document explains **who counts as Pro** in the product, how **Stripe** updates the database, and **which features are gated** behind Pro (or Free limits). For webhook URLs, env vars, and API flow details, see the technical integration guide:

- **[Stripe integration (checkout, webhooks, portal)](../src/app/api/stripe/README.md)**

---

## How “Pro access” is decided

The app uses **`isProAccess()`** (`src/features/pricing/utils/isProAccess.ts`) everywhere we gate features. Rules in plain language:

1. **Comped / manual Pro (early adopters)**  
   `subscription_tier === 'pro'`, **no** `stripe_subscription_id`, and **no** `stripe_customer_id` (never had a Stripe customer record).  
   → Treated as Pro. If a `cus_…` exists but the subscription id is empty (e.g. canceled + webhook lag), we **do not** treat them as comped — they need a successful subscription again.

2. **Paying subscribers**  
   Profile has a **`stripe_subscription_id`**.  
   → Pro only while Stripe **`subscription_status`** is **`active`** or **`trialing`**.  
   Statuses like **`past_due`**, **`unpaid`**, **`canceled`**, etc. revoke Pro in the app until billing is healthy again.  
   Access for billed users does **not** depend on `subscription_current_period_end` (that field is still stored for support/UI such as renewals, but the gate is Stripe status).

3. **Cancellation behavior**  
   If a customer cancels **at the end of the billing period**, Stripe usually keeps the subscription **`active`** until that period ends, then sends **`customer.subscription.deleted`**. While still **`active`**, they keep Pro access. When the subscription truly ends, webhooks set them back to Free in the database.

Failed renewals, checkout completion, and portal flows are described in the [Stripe README](../src/app/api/stripe/README.md).

---

## Pro vs Free: features and limits

Below is the **authoritative list** of what differs between Free and Pro in the **current codebase**. Use this when updating marketing, the Settings plan card, or `/dashboard/upgrade` copy.

| Area | Free | Pro |
|------|------|-----|
| **Portfolio images** | Up to **4** images shown on the **public** profile; editor limits adds to 4 for new uploads. If they previously had more than 4 in the DB, **extra images are not deleted**—visitors only see the first **4**. Constants: `FREE_MAX_PORTFOLIO_IMAGES` (4), `PRO_MAX_PORTFOLIO_IMAGES` (8) in `src/features/pricing/types.ts`. | Up to **8** images (public + editor). |
| **Verified badge** | Not shown on the public profile header. | Shown when the owner has Pro access (`src/app/[business-slug]/page.tsx`, owner dashboard profile view). |
| **Bookings (V2 / availability)** | **5** bookings per **calendar month** per business (rolling month stored on `business_profiles`). After the cap, public booking flow treats them as not accepting new bookings for that month. Constant: `FREE_BOOKINGS_LIMIT` = 5. | **Unlimited** (no cap enforcement). |
| **Service price options** | **No access** when the owner is not Pro: cannot enable or edit price options; saved options stay in the DB but **customers do not see** them on the public profile, service picker, or booking/details flow (see `hasPriceOptionsAccess`, `ownerHasProAccessForBusiness`, `getServiceWithAddOnsForBooking`, `resolvePublicBookingService`). | Full access; multi-price shown everywhere when enabled. |
| **Public “Request quote”** | Cannot enable **`accept_quote_req`** without Pro. Toggle is disabled on Free; API returns 403 if they try. Public quote request pages only work if the owner is Pro **and** opted in (`publicQuoteRequestPageAllowed`). | Can turn on **Request quote** on the quote/dashboard settings; public intake works when enabled. |
| **Customer check-in (SMS)** | **Check-in** on a customer opens an **upgrade teaser** instead of sending the Pro SMS flow (`CustomerDetailPanel`). | One-tap check-in with SMS deep link. |
| **Quotes dashboard** | Quote request funnels show **Pro** labels / upgrade prompts where `isFreeTier` is passed (e.g. `QuoteRequestsDashboardPage`, `QuoteRequestsSettingsCard`). | Full access to quote request settings and flows that require Pro. |

### Marketing copy reference

`PRO_FEATURES` in `src/features/pricing/types.ts` is used on upgrade/marketing surfaces (e.g. unlimited bookings, verified badge, more images, multiple price options). Keep that array aligned with this document when you change the paywall.

### Settings plan card

The **Subscription plan** block on Settings uses **`PlanSection`** (`src/features/pricing/components/PlanSection.tsx`) with a **`planId`** derived from `isProAccess` on the server. Update that component and related copy when you refresh how Free vs Pro is described in Settings.

---

## Quick code map (for engineers)

| Concern | Primary locations |
|--------|-------------------|
| Pro access helper | `src/features/pricing/utils/isProAccess.ts` |
| Stripe checkout & webhooks | `src/app/api/stripe/` (see README inside that folder) |
| Price options gate | `src/features/services/utils/priceOptionsAccess.ts`, `ServicePriceOptionsSection.tsx`, `updateService.ts` |
| Quote requests gate | `src/app/api/business-profile/accept-quote-requests/route.ts`, `publicQuoteRequestPageAllowed.ts`, quote dashboard/settings components |
| Portfolio limits | `PortfolioSection.tsx`, public `page.tsx` for `[business-slug]` |
| Booking monthly cap | `enforceFreeTierBookingCapBeforeCreate.ts`, public `book/page.tsx` |
| Check-in Pro gate | `CustomerDetailPanel.tsx`, `customers/page.tsx` (passes `hasProCheckInAccess`) |

---

## Changelog discipline

When adding a new Pro-only or Free-limited behavior:

1. Gate with **`isProAccess`** (or a dedicated helper that uses it, like `hasPriceOptionsAccess`).
2. Add a row or bullet **here** so the team keeps one source of truth for the paywall.
