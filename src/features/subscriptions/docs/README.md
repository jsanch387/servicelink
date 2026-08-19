# Memberships (Subscriptions) — developer reference

Customer membership plans on the **booking link**. Owners manage plans and subscribers in the dashboard; customers subscribe via Stripe Checkout on the connected account.

**Keep these docs current** when you change tables, APIs, gates, or Stripe wiring.

| Doc                                                         | Contents                                                     |
| ----------------------------------------------------------- | ------------------------------------------------------------ |
| [FLOWS.md](./FLOWS.md)                                      | **Start here.** Gates, APIs, owner/public/visit/cancel loops |
| [DATABASE.md](./DATABASE.md)                                | `membership_*` / `customer_memberships` columns, RLS         |
| [SMOKE_CHECKLIST.md](./SMOKE_CHECKLIST.md)                  | Manual pass/fail run                                         |
| [SMOKE_TEST_FOLLOWUPS.md](./SMOKE_TEST_FOLLOWUPS.md)        | Known gaps — don’t file as new bugs                          |
| [migrations/README.md](./migrations/README.md)              | SQL that was applied / leftover scripts                      |
| [Mobile contracts](../../../../../docs/contracts/README.md) | Native hand-off (data, visits, cancel, schedule link)        |

---

## Naming (UI vs DB/API)

| Layer                 | Term                   | Examples                                        |
| --------------------- | ---------------------- | ----------------------------------------------- |
| Dashboard / public UI | **Subscriptions**      | Nav, page titles, booking-link tab              |
| DB tables             | `membership_*`         | `membership_plans`, `customer_memberships`      |
| API / server          | memberships            | `/api/memberships`, `/api/public/memberships/*` |
| App types             | Subscription* / Owner* | `OwnerSubscriptionPlan`, `OwnerSubscriber`      |

**Why `membership_*`:** `profiles` already has Pro SaaS fields (`subscription_tier`, `stripe_subscription_id`). Customer plans must not collide with owner billing.

| Concern  | Pro SaaS (owner → ServiceLink) | Customer memberships                    |
| -------- | ------------------------------ | --------------------------------------- |
| Who pays | Business owner                 | End customer → owner Connect            |
| Tables   | `profiles.subscription_*`      | `membership_*` / `customer_memberships` |
| Checkout | Platform Stripe                | Connect Checkout `mode: subscription`   |

---

## Feature folder map

```
src/features/subscriptions/
├── config/          Rollout allowlist
├── components/      Owner dashboard + public subscribe / visit
├── server/          Access, CRUD, checkout, webhooks, visit linking
├── types/           Owner + customer shapes, access gates
├── utils/           Price, visit date bounds, SMS opt-in
├── constants/       Visit duration defaults
├── testing/         Unit tests
└── docs/            This documentation
```

**App pages:** `src/app/dashboard/subscriptions/**`, `src/app/[business-slug]/subscribe`  
**APIs:** `src/app/api/memberships/**`, `src/app/api/public/memberships/**`  
**Routes:** `src/constants/routes.ts`

---

## Status

| Area                                                        | Status                             |
| ----------------------------------------------------------- | ---------------------------------- |
| Owner create / edit / soft-delete plans                     | Live                               |
| Public subscribe → Stripe Checkout + webhook members        | Live                               |
| First visit + period visit (book / send link / cancel appt) | Live                               |
| Owner cancel membership (period-end / now)                  | Live                               |
| Duplicate subscribe blocked (email or phone)                | Live                               |
| Customer Portal manage / cancel                             | Live                               |
| Renewal reminder / invoice emails                           | Built; confirm on a real next bill |

---

## Security (short)

- **Owner APIs:** `getAuthenticatedUser` (cookie or Bearer) → `business_profiles.profile_id`. Plan writes: `assertMembershipsReady`. Subscriber reads/actions: `assertMembershipsSubscriberAccess` (still allowed if Pro lapses).
- **RLS:** owners **SELECT** `customer_memberships` / events / invoices only. Writes go through service role (webhooks, cancel, link visit).
- **Public:** checkout, customer snapshot, visit book, manage-link are rate-limited. Visit/manage URLs use HMAC tokens (`MEMBERSHIPS_MANAGE_SECRET`). Snapshot/checkout return **409** if that email/phone already has a live membership (intentional).
- **Do not** let the app update `customer_memberships` or call Stripe.

---

## Mobile contracts

Index: [docs/contracts/README.md](../../../../../docs/contracts/README.md) (Subscriptions section).
