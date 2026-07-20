# Pricing strategy and model

**Canonical detail (features + code map):** [`subscription-and-pro-features.md`](./subscription-and-pro-features.md)

This file is a short **entry point**; everything lives in the linked guide so we maintain one source of truth.

## App access by scenario (dashboard)

| Scenario                                                                  | Use the app?                                                                                                                                               | Feature set                                                                                             |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Free — no / ended Stripe** (`subscription_tier` not `pro`)              | **Yes** — full **Free** product after onboarding (no subscription paywall). Includes canceled Pro who were synced to Free.                                 | **Limited** Free (booking cap, portfolio cap, no price options / quotes / check-in SMS, etc.).          |
| **Pro — paying** (`active`, or legacy `trialing` if any remain)           | **Yes**.                                                                                                                                                   | **Full Pro**.                                                                                           |
| **Billing locked** (`subscription_tier` still `pro`, `isProAccess` false) | **No** normal dashboard — redirect to **`/dashboard/upgrade`** until billing is `active`/`trialing` again (rare sync gap / stuck `pro` row).               | _N/A_ until reactivated.                                                                                |
| **Comped Pro** (manual: `pro` tier, no `cus_…` / `sub_…`)                 | **Yes**.                                                                                                                                                   | **Full Pro** (same gates as paid).                                                                      |

**Note:** New onboarding no longer starts a 7-day Stripe trial. `trialing` remains a valid Stripe status for access if a legacy subscription is still in trial.

## Strategy in one page

| Pillar                      | Choice                                                                                                                                                                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Plans**                   | **Free** ($0) and **Pro** (recurring via Stripe; list **$20/mo** / **$200/yr** for new signups — confirm live price IDs). Grandfathered prices (e.g. $10/mo) stay on their Stripe Price until cancel/resubscribe.                            |
| **Trials**                  | **Not offered** for new signups. Onboarding completes Free via `POST /api/onboarding-v2/complete`.                                                                                                                                          |
| **Failed payment**          | Webhook sync sets **`subscription_tier`** to **`free`** when status is not `active`/`trialing`. User keeps Free app access; Settings shows payment-failed banner → Customer Portal. Stripe may still retry the invoice.                   |
| **Cancel**                  | At period end → `subscription.deleted` → Free, clears `stripe_subscription_id`, **keeps** `stripe_customer_id` for resubscribe.                                                                                                             |
| **Duplicate subs**          | Checkout blocked while customer has `active`/`trialing` sub — see [Stripe README](../src/app/api/stripe/README.md).                                                                                                                         |
| **Monthly → yearly**        | Not an in-app switch yet; cancel + resubscribe yearly, or change price in Stripe Dashboard.                                                                                                                                                 |
| **Comped Pro**              | `subscription_tier === 'pro'` with **no** `stripe_customer_id` and **no** `stripe_subscription_id`.                                                                                                                                          |
| **Free limits**             | E.g. booking cap, services cap, portfolio cap — see the main doc table.                                                                                                                                                                     |

## Where things live in code

| Topic                                 | Location                                                                                                                                                              |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pro vs comped vs billed rules         | `src/features/pricing/utils/isProAccess.ts`                                                                                                                           |
| “Has Stripe history” (helpers)        | `hasStripeBillingHistory` in same file                                                                                                                                |
| Dashboard access gate                 | `src/middleware.ts` (after onboarding complete) — paywall only when tier is still **`pro`** without `isProAccess`                                                       |
| Profile sync from Stripe              | `syncProfileFromSubscriptionUpdated.ts`, `downgradeProfileFromSubscriptionEnd.ts`                                                                                     |
| Checkout & webhooks                   | `src/app/api/stripe/README.md`                                                                                                                                        |
| Mobile parity                         | `docs/contracts/mobile-entitlement-paywall.md`, `docs/contracts/mobile-onboarding-complete.md`, `src/app/api/stripe/README.md` (subscription APIs removed 2026-05-19) |
