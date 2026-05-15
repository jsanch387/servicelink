# Pricing strategy, subscription model, and Pro features

**Quick summary:** [`pricing-strategy-and-model.md`](./pricing-strategy-and-model.md)

This document is the **authoritative** reference for **product strategy**, **access rules**, **Stripe ↔ database behavior**, and **Free vs Pro capabilities** in code.

For webhook URLs, env vars, and checkout API steps, see:

- **[Stripe integration (checkout, webhooks, portal)](../src/app/api/stripe/README.md)**

Mobile clients should align with:

- **[Mobile entitlement & paywall](./contracts/mobile-entitlement-paywall.md)**

---

## Product and pricing strategy

| Element | Direction |
|--------|-----------|
| **Plans** | **Free** and **Pro** only (`PlanId` in `src/features/pricing/types.ts`). |
| **Pro price** | Marketing copy uses **`PLANS.pro.price`** (currently `$10`); **live amount** comes from **Stripe** (`STRIPE_PRO_PRICE_ID`). Keep Dashboard / pricing page in sync when Stripe list price changes. |
| **Monetization goal** | Free tier is **usable** so businesses can start (with caps). Pro unlocks **scale** (bookings, branding, payments-adjacent features, quotes). |
| **Stripe** | **One Customer per profile** when `stripe_customer_id` is known — reuse on Checkout to avoid duplicate `cus_…` rows (see Stripe README). |
| **Trials** | **7-day** subscription trial in Stripe (`trialing`). Same in-app **Pro entitlements** as a paying subscriber while the trial is valid. |

---

## App access by scenario

Use this table for product and support language. **Code:** `hasStripeBillingHistory` + `isProAccess` in middleware (`src/middleware.ts`) after onboarding is complete.

| Scenario | Dashboard / app | Capabilities |
|----------|------------------|--------------|
| **Free — never Stripe** | **Full access** to the app on the **Free** plan. No subscription paywall. | **Limited features:** e.g. lifetime booking cap, portfolio cap, no multi-price options, no public quote intake, no check-in SMS, etc. (see feature matrix below). |
| **Free trial** (`subscription_status` **`trialing`**) | **Full access** — same navigation as a paying subscriber during the trial. | **Full Pro** feature set (all Pro gates pass via `isProAccess`). |
| **After trial ends** (still has `cus_…` / history, not `active`/`trialing`) | **Paywalled:** redirected to **`/dashboard/upgrade`** for all dashboard routes except that page. Not treated as “Free no Stripe” inside the app. | Must resubscribe or fix billing to use the dashboard again. |
| **Pro — paying** (`active`) | **Full access.** | **Full Pro** feature set. |
| **Comped / manual Pro** (`pro` tier, **no** `stripe_customer_id`, **no** `stripe_subscription_id`) | **Full access.** | **Full Pro** feature set. |

**Summary:** Free-without-Stripe = **app + limited features**. Trial = **app + full features**, then **paywall** if they do not convert. Pro = **app + full features**.

---

## Who gets dashboard access (web)

After **onboarding is complete**, middleware (`src/middleware.ts`) applies two cohorts:

### A — Legacy / never billed (true Free)

If **`hasStripeBillingHistory`** is **false** — no `stripe_customer_id`, no `stripe_subscription_id`, and no **`subscription_status`** string on `profiles` — the user is **not** on the subscription paywall. They can use the **full Free** product (subject to Free limits below).

### B — Touched Stripe (trial, paid, or churned)

If **any** of those three fields is set, **`hasStripeBillingHistory`** is **true**. Then the user must pass **`isProAccess()`** to open any **`/dashboard/**`** route **except** **`/dashboard/upgrade`**.

- **`isProAccess` true** → normal dashboard navigation (Pro or `trialing`).
- **`isProAccess` false** → redirect to **`/dashboard/upgrade`** until they subscribe or fix billing (hard paywall for churned trial / `past_due` / `canceled`, etc.).

So: **churned users with a saved `cus_…` are not “Free app users”; they are upgrade-only** until Pro is active again.

---

## How “Pro access” is decided (`isProAccess`)

Implemented in **`src/features/pricing/utils/isProAccess.ts`**. Used for **feature gates**, Settings plan label, and (with **`hasStripeBillingHistory`**) paywall logic.

1. **Comped / manual Pro**  
   `subscription_tier === 'pro'`, **no** `stripe_subscription_id`, and **no** `stripe_customer_id`.  
   → **Pro**. If **`stripe_customer_id`** exists but subscription id is empty (e.g. canceled + lag), they are **not** treated as comped — they must resubscribe.

2. **Billed subscribers**  
   Non-empty **`stripe_subscription_id`**.  
   → **Pro** only if **`subscription_tier === 'pro'`** and **`subscription_status`** is **`active`**, **`trialing`**, or **empty/null** (short grace for webhook lag).  
   **`past_due`**, **`unpaid`**, **`canceled`**, etc. → **not Pro** in the app.

3. **`subscription_tier === 'free'`**  
   → **Not Pro** (even if a Stripe customer id remains).

4. **Period end**  
   For billed users, **`subscription_current_period_end`** does **not** grant or revoke access in `isProAccess`. Source of truth is **Stripe subscription status** (e.g. stay **`active`** until period ends when cancel-at-period-end is set).

---

## Trial lifecycle (Stripe + database)

| Phase | Stripe | Typical `profiles` | Dashboard |
|--------|--------|-------------------|-----------|
| **On trial** | `trialing` | `subscription_tier` usually **`pro`**, `subscription_status` **`trialing`** | Full access (Pro) |
| **Trial converts** | `active` | `pro` / `active` | Full access |
| **Trial ends / payment fails / canceled** | `past_due`, `unpaid`, `canceled`, … | Webhook **`customer.subscription.updated`** → `syncProfileFromSubscriptionUpdated` sets **`subscription_tier`** to **`free`** unless status is `active` or `trialing` | Paywalled if `hasStripeBillingHistory` |
| **Subscription removed** | `customer.subscription.deleted` | **`downgradeProfileFromSubscriptionEnd`**: `free`, clears **`stripe_subscription_id`** & period fields; **keeps** **`stripe_customer_id`** | Still paywalled until new **`active`/`trialing`** |

---

## Public profile “live” vs visitors

**`isPublicBusinessProfileLive`** (`src/features/pricing/utils/publicBusinessProfileLive.ts`):

- Owner must have **`onboarding_status === 'completed'`**.
- Profile is **live** if **`isProAccess`** **or** if they are **grandfathered Free**: tier is not Pro **and** **`hasStripeBillingHistory`** is **false**.

So ex-trial / churned users with Stripe history often **lose** public live status until they are Pro again — align support copy with that.

---

## Pro vs Free: features and limits

Authoritative **current codebase** differences (update this table when you change gates).

| Area | Free | Pro |
|------|------|-----|
| **Portfolio images** | Up to **4** on public + editor cap for new uploads (`FREE_MAX_PORTFOLIO_IMAGES`). Extra rows in DB may exist; public shows first 4. | Up to **8** (`PRO_MAX_PORTFOLIO_IMAGES`). |
| **Verified badge** | Hidden on public header. | Shown when owner has Pro access. |
| **Bookings (V2 / availability)** | **5** accepted bookings **lifetime** per **`business_profiles`** row (`FREE_BOOKINGS_LIMIT`). Tracked with **`free_bookings_count`** only. The `free_bookings_month` column remains in the DB for legacy rows but is **not** used by app logic. | Unlimited (cap not applied). |
| **Services (dashboard / onboarding)** | Up to **5** services per business (`FREE_MAX_SERVICES`). Businesses that **already** have more keep them, but Free users **cannot add** another until they upgrade or delete down. Enforced in **`createService`** and onboarding **`saveStep2`** (replace-all uses `maxServiceCountAllowedOnFreeTier`). | Unlimited |
| **Service price options** | Cannot enable for customers without Pro; options may exist in DB but public flows hide them. | Full multi-price UX when enabled. |
| **Public “Request quote”** | Cannot enable **`accept_quote_req`** without Pro; API 403 if forced. | Opt-in + public intake when allowed. |
| **Customer check-in (SMS)** | Free → upgrade teaser instead of Pro SMS flow. | Full check-in. |
| **Quotes dashboard** | Upgrade prompts where `isFreeTier` is used. | Full access to Pro-gated quote surfaces. |
| **Connect / owner payouts** | Gated similarly (use same profile helpers as payments features). | Requires Pro for payment surfaces that enforce it. |

### Marketing copy reference

**`PRO_FEATURES`** in `src/features/pricing/types.ts` drives upgrade / pricing bullets. Keep aligned with this table.

### Settings plan card

**`PlanSection`** (`src/features/pricing/components/PlanSection.tsx`) derives display from **`isProAccess`** on the server.

---

## Quick code map (for engineers)

| Concern | Primary locations |
|--------|-------------------|
| Pro access | `src/features/pricing/utils/isProAccess.ts` |
| Dashboard paywall | `src/middleware.ts` |
| Stripe checkout & webhooks | `src/app/api/stripe/` (+ README) |
| Price options gate | `src/features/services/utils/priceOptionsAccess.ts`, related APIs |
| Quote requests gate | `accept-quote-requests` route, `publicQuoteRequestPageAllowed.ts` |
| Portfolio limits | `PortfolioSection`, `[business-slug]/page.tsx` |
| Free booking lifetime cap | `enforceFreeTierBookingCapBeforeCreate.ts`, `public/bookings` route |
| Free service count cap | `features/services/server/freeTierServiceLimit.ts`, `createService.ts`, `onboarding-v2/server/saveStep2.ts` |
| Check-in Pro gate | `CustomerDetailPanel`, `customers/page.tsx` |
| Public booking “at cap” UX | `resolvePublicBookingFreeTierGate`, `book/page.tsx` |

---

## Changelog discipline

When adding Pro-only or Free-limited behavior:

1. Gate with **`isProAccess`** (or a thin helper that uses it).
2. Update the **table** in this doc.
3. If behavior changes **who** hits the paywall or **public live** rules, update the **Access** / **Public profile** sections above.
