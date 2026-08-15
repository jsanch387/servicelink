# Memberships (Subscriptions) — developer reference

Customer membership plans on the **booking link**. Owners create plans in the dashboard; customers see them on the public profile and (soon) pay via Stripe Checkout on the connected account.

**Keep these docs current** when you change tables, APIs, gates, or Stripe wiring.

| Doc                                            | Contents                                                                                        |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| [FLOWS.md](./FLOWS.md)                         | **Start here.** Owner create/edit/delete, public display, what we save & pull, gates, rollout   |
| [SMOKE_CHECKLIST.md](./SMOKE_CHECKLIST.md)     | Round-2 pass/fail run (subscribe, appointments, cancel)                                         |
| [SMOKE_TEST_FOLLOWUPS.md](./SMOKE_TEST_FOLLOWUPS.md) | Gaps found in testing — don’t file known skips as new bugs                                 |
| [DATABASE.md](./DATABASE.md)                   | `membership_plans` + `membership_plan_prices` columns, constraints, RLS, Stripe ID placeholders |
| [migrations/README.md](./migrations/README.md) | SQL run order for Supabase                                                                      |

---

## Naming (UI vs DB/API)

| Layer                 | Term                   | Examples                                              |
| --------------------- | ---------------------- | ----------------------------------------------------- |
| Dashboard / public UI | **Subscriptions**      | Nav, page titles, booking-link tab                    |
| DB tables             | `membership_*`         | `membership_plans`, `membership_plan_prices`          |
| API / server modules  | memberships            | `/api/memberships`, `createMembershipPlanForBusiness` |
| App types             | Subscription* / Owner* | `OwnerSubscriptionPlan`, `CustomerSubscriptionPlan`   |

**Why `membership_*`:** `profiles` already has Pro SaaS fields (`subscription_tier`, `stripe_subscription_id`, …). Customer plans must never collide with owner billing.

| Concern        | Pro SaaS (owner → ServiceLink)    | Customer memberships         |
| -------------- | --------------------------------- | ---------------------------- |
| Who pays       | Business owner                    | End customer → owner Connect |
| Tables         | `profiles.subscription_*`         | `membership_*`               |
| Checkout today | Platform Stripe Checkout / portal | **Not wired yet**            |

---

## Feature folder map

```
src/features/subscriptions/
├── config/          Rollout allowlist
├── components/      Owner dashboard + public cards; gates/
├── server/          Access, CRUD, public loader, mappers
├── types/           Owner + customer plan shapes, access gates
├── utils/           Price formatting, description split/join
├── constants/       Legacy UI mocks (subscribers) — not live data
├── testing/         Allowlist unit tests
└── docs/            This documentation
```

**App pages:** `src/app/dashboard/subscriptions/**`  
**APIs:** `src/app/api/memberships/**`  
**Routes:** `src/constants/routes.ts` → `ROUTES.DASHBOARD.SUBSCRIPTIONS*` / `API_ROUTES.MEMBERSHIPS*`

---

## Status (what works today)

| Area                                       | Status                                                        |
| ------------------------------------------ | ------------------------------------------------------------- |
| Owner create / edit / soft-delete plans    | ✅ Live                                                       |
| Owner list + plan detail                   | ✅ Live                                                       |
| Public booking-link tab + cards            | ✅ Live (published plans)                                     |
| Gradual rollout allowlist                  | ✅ Live                                                       |
| Pro / Connect / payments gates             | ✅ Live                                                       |
| Stripe Product + Price sync on create/edit | ✅ Live (Connect account; `stripe_*` stored)                  |
| Checkout `mode: 'subscription'`            | ✅ Public Continue → Stripe Checkout (no webhook/members yet) |
| Customer memberships table / webhooks      | ❌ Not started                                                |
| Edit/delete subscriber safety              | ✅ Gates wired; counters stub `0` until members table         |
| Owner Subscribers tab                      | ⚠️ Empty / mock until members exist                           |

---

## Roadmap (planned next)

1. ~~Sync Stripe Product + Price(s) on create/edit~~
2. ~~Public Continue → Checkout session (`mode: 'subscription'`)~~
3. `customer_memberships` (name TBD) + webhooks → real subscribers + delete safety.
4. Customer Portal for cancel / payment method. + receipt emails.

Update [FLOWS.md](./FLOWS.md) and [DATABASE.md](./DATABASE.md) as each step lands.
