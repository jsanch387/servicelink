# Pricing strategy, subscription model, and Pro features

**Quick summary:** [`pricing-strategy-and-model.md`](./pricing-strategy-and-model.md)

This document is the **authoritative** reference for **product strategy**, **access rules**, **Stripe ↔ database behavior**, and **Free vs Pro capabilities** in code.

For webhook URLs, env vars, and checkout API steps, see:

- **[Stripe integration (checkout, webhooks, portal)](../src/app/api/stripe/README.md)**

Mobile clients should align with:

- **[Mobile entitlement & paywall](./contracts/mobile-entitlement-paywall.md)**

---

## Product and pricing strategy

| Element               | Direction                                                                                                                                                                                                                                                                                                                                |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Plans**             | **Free** and **Pro** only (`PlanId` in `src/features/pricing/types.ts`).                                                                                                                                                                                                                                                                 |
| **Pro price**         | Marketing copy uses **`PLANS.pro.price`** (currently `$20` for new signups); **live charge** comes from **Stripe** (`STRIPE_PRO_PRICE_ID` for new Checkout). **Grandfathered** subscribers keep their existing Stripe Price (e.g. `$10/mo`) until they cancel/resubscribe; Settings shows the amount from Stripe, not `PLANS.pro.price`. |
| **Monetization goal** | Free tier is **usable** so businesses can start (with caps). Pro unlocks **scale** (bookings, branding, payments-adjacent features, quotes).                                                                                                                                                                                             |
| **Stripe**            | **One Customer per profile** when `stripe_customer_id` is known — reuse on Checkout to avoid duplicate `cus_…` rows. **Duplicate subscriptions** blocked while `active`/`trialing` (see Stripe README).                                                                                                                                                                                                 |
| **Trials**            | **Not offered** for new signups (onboarding is Free). Legacy Stripe `trialing` still grants Pro via `isProAccess` if any remain.                                                                                                                                                                                                   |

---

## App access by scenario

Use this table for product and support language. **Code:** `hasStripeBillingHistory` + `isProAccess` in middleware (`src/middleware.ts`) after onboarding is complete.

| Scenario                                                                                           | Dashboard / app                                                                                                                                  | Capabilities                                                                                                                                                      |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Free — never Stripe / canceled to Free**                                                         | **Full access** to the app on the **Free** plan. No subscription paywall.                                                                        | **Limited features:** e.g. lifetime booking cap, portfolio cap, no multi-price options, no public quote intake, no check-in SMS, etc. (see feature matrix below). |
| **Legacy trial** (`subscription_status` **`trialing`**) — if any remain                            | **Full access** — same navigation as a paying subscriber while `trialing`.                                                                       | **Full Pro** feature set (all Pro gates pass via `isProAccess`).                                                                                                  |
| **Billing locked** (`subscription_tier` still **`pro`**, `isProAccess` false)                      | **Paywalled:** redirected to **`/dashboard/upgrade`** until billing is healthy again.                                                            | Must resubscribe or fix billing.                                                                                                                                  |
| **Pro — paying** (`active`)                                                                        | **Full access.** Active Pro visiting `/dashboard/upgrade` is redirected to `/dashboard`.                                                         | **Full Pro** feature set.                                                                                                                                         |
| **Comped / manual Pro** (`pro` tier, **no** `stripe_customer_id`, **no** `stripe_subscription_id`) | **Full access.**                                                                                                                                 | **Full Pro** feature set.                                                                                                                                         |

**Summary:** Free = **app + limited features**. Pro / legacy trialing = **app + full features**. Hard paywall only when the profile is still marked **`pro`** without access (not the normal cancel/fail path, which syncs tier to **`free`**).

---

## Who gets dashboard access (web)

After **onboarding is complete**, middleware (`src/middleware.ts`) applies:

### A — Free tier (`subscription_tier` ≠ `pro`)

Full Free dashboard access (subject to Free feature limits). This includes never-paid users **and** users synced to Free after cancel / failed payment (`syncProfileFromSubscriptionUpdated` / `downgradeProfileFromSubscriptionEnd`). A leftover `stripe_customer_id` alone does **not** paywall them.

### B — Pro tier with Stripe billing history

When **`subscription_tier === 'pro'`** and the profile has Stripe billing history (`needsPaidProResubscribeForDashboard`):

- **`isProAccess` true** → normal dashboard. Visiting **`/dashboard/upgrade`** redirects to **`/dashboard`**.
- **`isProAccess` false** → redirect to **`/dashboard/upgrade`** until billing is healthy again (stuck/`past_due` while tier still `pro`, sync lag, etc.).

Comped Pro (tier `pro`, no Stripe ids) is not in this gate and keeps full access.

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

## Subscription lifecycle (Stripe + database)

| Phase                         | Stripe                              | Typical `profiles`                                                                                                                                                    | Dashboard                                                              |
| ----------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **Paid Pro**                  | `active`                            | `pro` / `active`                                                                                                                                                      | Full Pro; `/dashboard/upgrade` → redirect to `/dashboard`              |
| **Legacy trial** (if any)     | `trialing`                          | `pro` / `trialing`                                                                                                                                                    | Full Pro                                                               |
| **Payment fails**             | `past_due`, `unpaid`, …             | Webhook sync → **`subscription_tier` = `free`**, status from Stripe                                                                                                   | Free app access + Settings payment-failed banner → portal              |
| **Cancel (period ended)**     | `customer.subscription.deleted`     | **`downgradeProfileFromSubscriptionEnd`**: `free`, clears **`stripe_subscription_id`**; **keeps** **`stripe_customer_id`**                                            | Free app access; can resubscribe (same customer)                       |
| **Billing locked** (edge)     | not granting Pro                    | Tier still **`pro`** but `isProAccess` false                                                                                                                          | Paywalled to `/dashboard/upgrade` until fixed                          |

---

## Public profile “live” vs visitors

**`isPublicBusinessProfileLive`** (`src/features/pricing/utils/publicBusinessProfileLive.ts`):

- Owner must have **`onboarding_status === 'completed'`**.
- Profile is **live** if **`isProAccess`** **or** if they are **grandfathered Free**: tier is not Pro **and** **`hasStripeBillingHistory`** is **false**.

So ex-trial / churned users with Stripe history often **lose** public live status until they are Pro again — align support copy with that.

---

## Pro vs Free: features and limits

Authoritative **current codebase** differences (update this table when you change gates).

| Area                                  | Free                                                                                                                                                                                                                                                                                                     | Pro                                                |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **Portfolio images**                  | Up to **4** on public + editor cap for new uploads (`FREE_MAX_PORTFOLIO_IMAGES`). Extra rows in DB may exist; public shows first 4.                                                                                                                                                                      | Up to **8** (`PRO_MAX_PORTFOLIO_IMAGES`).          |
| **Verified badge**                    | Hidden on public header.                                                                                                                                                                                                                                                                                 | Shown when owner has Pro access.                   |
| **Bookings (V2 / availability)**      | **5** accepted bookings **lifetime** per **`business_profiles`** row (`FREE_BOOKINGS_LIMIT`). Tracked with **`free_bookings_count`** only. The `free_bookings_month` column remains in the DB for legacy rows but is **not** used by app logic.                                                          | Unlimited (cap not applied).                       |
| **Services (dashboard / onboarding)** | Up to **5** services per business (`FREE_MAX_SERVICES`). Businesses that **already** have more keep them, but Free users **cannot add** another until they upgrade or delete down. Enforced in **`createService`** and onboarding **`saveStep2`** (replace-all uses `maxServiceCountAllowedOnFreeTier`). | Unlimited                                          |
| **Service price options**             | Cannot enable for customers without Pro; options may exist in DB but public flows hide them.                                                                                                                                                                                                             | Full multi-price UX when enabled.                  |
| **Public “Request quote”**            | Cannot enable **`accept_quote_req`** without Pro; API 403 if forced.                                                                                                                                                                                                                                     | Opt-in + public intake when allowed.               |
| **Customer check-in (SMS)**           | Free → upgrade teaser instead of Pro SMS flow.                                                                                                                                                                                                                                                           | Full check-in.                                     |
| **Quotes dashboard**                  | Upgrade prompts where `isFreeTier` is used.                                                                                                                                                                                                                                                              | Full access to Pro-gated quote surfaces.           |
| **Marketing (promo codes & sales)**   | Not available — read-only or upgrade CTA when UI ships. No new redemptions. See [marketing docs](../src/features/marketing/docs/README.md).                                                                                                                                                              | Full CRUD + customer redemptions.                  |
| **Connect / owner payouts**           | Gated similarly (use same profile helpers as payments features).                                                                                                                                                                                                                                         | Requires Pro for payment surfaces that enforce it. |

### Marketing copy reference

**`PRO_FEATURES`** in `src/features/pricing/types.ts` drives upgrade / pricing bullets. Keep aligned with this table.

### Settings plan card

**`PlanSection`** (`src/features/pricing/components/PlanSection.tsx`) derives display from **`isProAccess`** on the server.

---

## Quick code map (for engineers)

| Concern                    | Primary locations                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Pro access                 | `src/features/pricing/utils/isProAccess.ts`                                                                 |
| Dashboard paywall          | `src/middleware.ts`                                                                                         |
| Stripe checkout & webhooks | `src/app/api/stripe/` (+ README)                                                                            |
| Price options gate         | `src/features/services/utils/priceOptionsAccess.ts`, related APIs                                           |
| Quote requests gate        | `accept-quote-requests` route, `publicQuoteRequestPageAllowed.ts`                                           |
| Portfolio limits           | `PortfolioSection`, `[business-slug]/page.tsx`                                                              |
| Free booking lifetime cap  | `enforceFreeTierBookingCapBeforeCreate.ts`, `public/bookings` route                                         |
| Free service count cap     | `features/services/server/freeTierServiceLimit.ts`, `createService.ts`, `onboarding-v2/server/saveStep2.ts` |
| Check-in Pro gate          | `CustomerDetailPanel`, `customers/page.tsx`                                                                 |
| Marketing Pro gate         | `src/features/marketing/docs/FLOWS.md` (planned: dashboard routes + server actions + public apply)          |
| Public booking “at cap” UX | `resolvePublicBookingFreeTierGate`, `book/page.tsx`                                                         |

---

## Changelog discipline

When adding Pro-only or Free-limited behavior:

1. Gate with **`isProAccess`** (or a thin helper that uses it).
2. Update the **table** in this doc.
3. If behavior changes **who** hits the paywall or **public live** rules, update the **Access** / **Public profile** sections above.
