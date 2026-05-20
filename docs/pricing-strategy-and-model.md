# Pricing strategy and model

**Canonical detail (features + code map):** [`subscription-and-pro-features.md`](./subscription-and-pro-features.md)

This file is a short **entry point**; everything lives in the linked guide so we maintain one source of truth.

## App access by scenario (dashboard)

| Scenario | Use the app? | Feature set |
|----------|----------------|-------------|
| **Free — no Stripe** (`hasStripeBillingHistory` false) | **Yes** — full **Free** product (no subscription paywall after onboarding). | **Limited** Free (lifetime booking cap, portfolio cap, no price options / quotes / check-in SMS, etc.). |
| **Trial** (`trialing`, Stripe subscription active in trial) | **Yes** — same as paid Pro while trial runs. | **Full Pro** entitlements. |
| **Trial ended / churned** (Stripe history remains, `isProAccess` false) | **No** normal dashboard — **hard paywall** → only **`/dashboard/upgrade`** (and auth routes) until they subscribe or billing is `active`/`trialing` again. | *N/A* until reactivated. |
| **Pro — paying** (`active`) | **Yes**. | **Full Pro**. |
| **Comped Pro** (manual: `pro` tier, no `cus_…` / `sub_…`) | **Yes**. | **Full Pro** (same gates as paid). |

Trials are included in “touched Stripe”: once they start a trial they have billing history; when the trial ends without a good subscription, they move to the paywalled row—not back to “Free no Stripe” limits inside the dashboard.

## Strategy in one page

| Pillar | Choice |
|--------|--------|
| **Plans** | **Free** ($0) and **Pro** (recurring subscription via Stripe; list price in app: **$10/mo** in `PLANS.pro` — confirm live `STRIPE_PRO_PRICE_ID`). |
| **Trial** | **7-day** Stripe trial (`trialing`). Same product entitlements as paid Pro while trial is active. |
| **After trial / failed payment** | Profile sync sets **`subscription_tier`** to **`free`** when Stripe status is not `active` / `trialing`. Users with **any Stripe billing history** (`cus_…`, `sub_…`, or stored `subscription_status`) are **paywalled** on the dashboard (redirect to `/dashboard/upgrade`) until they are Pro again. |
| **Never-subscribed Free** | No Stripe customer / sub / status on profile → **full Free app access** (no subscription paywall). |
| **Comped Pro** | `subscription_tier === 'pro'` with **no** `stripe_customer_id` and **no** `stripe_subscription_id` → treated as Pro (manual / early adopters). |
| **Free limits** | E.g. **5 lifetime V2 bookings** per business, **5 services** per business, portfolio cap, no price options / quote intake / check-in SMS until Pro — see the main doc table. |

## Where things live in code

| Topic | Location |
|--------|----------|
| Pro vs comped vs billed rules | `src/features/pricing/utils/isProAccess.ts` |
| “Has Stripe history” (paywall cohort) | `hasStripeBillingHistory` in same file |
| Dashboard paywall | `src/middleware.ts` (after onboarding complete) |
| Profile sync from Stripe | `syncProfileFromSubscriptionUpdated.ts`, `downgradeProfileFromSubscriptionEnd.ts` |
| Checkout & webhooks | `src/app/api/stripe/README.md` |
| Mobile parity | `docs/contracts/mobile-entitlement-paywall.md`, `docs/contracts/mobile-onboarding-complete.md`, `src/app/api/stripe/README.md` (subscription APIs removed 2026-05-19) |

Read **[subscription-and-pro-features.md](./subscription-and-pro-features.md)** next for the full feature matrix and engineer code map.
