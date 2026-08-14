# Memberships — flows (save, pull, UX)

End-to-end behavior for owner dashboard and public booking link. Pair with [DATABASE.md](./DATABASE.md) for columns.

---

## Access gates

Resolved by `loadMembershipsAccess` / `assertMembershipsReady`:

```
not_in_rollout → not_pro → needs_connect → needs_payments → ready
```

| Gate             | Meaning                                            | UI                                |
| ---------------- | -------------------------------------------------- | --------------------------------- |
| `not_in_rollout` | Owner email not on allowlist (and open-to-all off) | Redirect `/dashboard`; nav hidden |
| `not_pro`        | No Pro entitlement                                 | `SubscriptionsNotProGate`         |
| `needs_connect`  | Stripe Connect incomplete / charges not enabled    | `SubscriptionsConnectGate`        |
| `needs_payments` | `payment_settings.payments_enabled` false          | `SubscriptionsPaymentsGate`       |
| `ready`          | Can manage plans                                   | Create-first or plan list         |

**Rollout config:** `config/membershipsRolloutAllowlist.ts`

- `MEMBERSHIPS_ROLLOUT_OWNER_EMAILS` — lowercase auth emails
- `MEMBERSHIPS_ROLLOUT_OPEN_TO_ALL` — `true` = everyone with Pro/Connect/payments

Gated surfaces: dashboard nav + routes, write APIs, public Subscriptions tab (via owner email check in `isBusinessInMembershipsRollout`).

---

## Owner dashboard routes

| Constant                         | Path                                        |
| -------------------------------- | ------------------------------------------- |
| `ROUTES.DASHBOARD.SUBSCRIPTIONS` | `/dashboard/subscriptions`                  |
| `SUBSCRIPTIONS_NEW`              | `/dashboard/subscriptions/new`              |
| `SUBSCRIPTIONS_DETAIL(planId)`   | `/dashboard/subscriptions/[planId]`         |
| `SUBSCRIPTIONS_EDIT(planId)`     | `/dashboard/subscriptions/[planId]/edit`    |
| `SUBSCRIPTIONS_SUBSCRIBER(id)`   | `/dashboard/subscriptions/subscribers/[id]` |

Central definitions: `src/constants/routes.ts`.

### Ready UI phases

1. **0 plans** → create-first empty state → `/new`
2. **≥1 plan** → Plans | Subscribers tabs
   - Plans: cards → detail. Card count is **active** members only (`active` / `trialing` / `past_due` / `unpaid` / `paused`).
   - Subscribers: **current** members by default (same statuses as the plan count, and still on a live plan). Canceled / incomplete / removed-plan rows stay behind **Show canceled (N)** or **Show ended (N)**. Removed plans keep their name with `(removed)` (or **Removed plan** if the name is gone) and do not link to plan detail.

---

## HTTP APIs

| Method   | Path                              | Purpose                                 |
| -------- | --------------------------------- | --------------------------------------- |
| `GET`    | `/api/memberships`                | List owner plans (non-deleted)          |
| `POST`   | `/api/memberships/plans`          | Create plan + prices                    |
| `PATCH`  | `/api/memberships/plans/[planId]` | Update plan + sync prices               |
| `DELETE` | `/api/memberships/plans/[planId]` | Soft-delete (409 if active subscribers) |

Constants: `API_ROUTES.MEMBERSHIPS`, `MEMBERSHIPS_PLANS`, `MEMBERSHIPS_PLAN(id)`.

**Auth:** Supabase session + `resolveCurrentBusinessId`.  
**Writes:** also `assertMembershipsReady` (403 + `gate` if not ready).

### Write body (create + update)

```json
{
  "name": "Monthly Detail Club",
  "description": "Keep the car looking fresh.\n• Interior wipe-down\n• Exterior wash",
  "visitDurationMinutes": 60,
  "cadenceOptions": [
    { "intervalUnit": "week", "intervalCount": 1, "priceCents": 4900 },
    { "intervalUnit": "month", "intervalCount": 1, "priceCents": 15900 }
  ]
}
```

Validated by `parseMembershipPlanWriteBody`:

- `name` required
- `visitDurationMinutes` required: 30–630, multiples of 30 (defaults to 60 if omitted)
- ≥1 cadence; `intervalUnit` ∈ week|month|year; `intervalCount` ≥ 1; `priceCents` > 0
- No duplicate `(intervalUnit, intervalCount)` pairs

---

## What we save (owner create / edit)

### Create — `createMembershipPlanForBusiness`

| Destination              | Fields written                                                                                                                                                                |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `membership_plans`       | `business_id`, `name`, `description`, `visit_duration_minutes`, `benefits` (from split), `is_published: true`, `is_popular: false`, `sort_order: 0`, then `stripe_product_id` |
| `membership_plan_prices` | one row per cadence: `interval_*`, `price_cents`, `currency: 'usd'`, `is_default` (first = true), then `stripe_price_id`                                                      |
| Stripe Connect           | Product + Price(s) via `syncMembershipPlanStripeCatalog`                                                                                                                      |

Order: resolve Connect account → insert DB → Stripe sync → store IDs.  
If price insert **or** Stripe sync fails → plan row **hard-deleted** (cascade prices).

### Update — `updateMembershipPlanForBusiness`

| Destination | Behavior                                                                                                                   |
| ----------- | -------------------------------------------------------------------------------------------------------------------------- |
| Plan row    | Update name / description / benefits / `visit_duration_minutes` (always allowed)                                           |
| Prices      | Match by `interval_unit:interval_count`; update cents + default; **insert** new cadences; **hard-delete** removed cadences |
| Stripe      | Re-sync Product; new Price when amount/interval no longer matches; archive removed cadence Prices (best-effort)            |

**Subscriber safety (edit):**

| Change                     | If customers subscribed                                                                            |
| -------------------------- | -------------------------------------------------------------------------------------------------- |
| Name / description         | Allowed (Stripe Product updated)                                                                   |
| Add cadence                | Allowed                                                                                            |
| Change amount on a cadence | Allowed — new Stripe Price for **new** checkouts; existing Stripe Subscribers keep their old Price |
| Remove a cadence           | **Blocked** if that price row has active subscribers (`countActivePriceSubscribers`)               |

If Stripe sync fails after DB update → API returns error (owner can retry edit).

### Delete — `deleteMembershipPlanForBusiness`

1. Ensure plan exists and `deleted_at` is null
2. `countActivePlanSubscribers` — if `> 0`, fail with `has_subscribers` (409)
3. Set `deleted_at = now()`

**UI:** Delete opens a confirm modal only when `activeSubscriberCount === 0`. If there are subscribers, the modal explains delete is blocked (no Delete action).

**Policy:** soft-delete in DB (`deleted_at`); never auto-cancel Stripe members. After soft-delete, archive Stripe Product + Prices (`active: false`) on the connected account (best-effort). Stripe objects are not hard-deleted; IDs stay on our rows.

Stub today: plan/price subscriber counters always return `0`.

---

## What we pull

### Owner list / detail

| Loader                         | Client       | Filter                                                 | Returns                                   |
| ------------------------------ | ------------ | ------------------------------------------------------ | ----------------------------------------- |
| `loadOwnerMembershipsState`    | User session | `deleted_at IS NULL`, order `sort_order`, `created_at` | `OwnerSubscriptionPlan[]` (+ access gate) |
| `getMembershipPlanForBusiness` | User session | id + business + not deleted                            | Single plan + prices                      |

Used by dashboard pages (server components) and `GET /api/memberships`.

### Public booking link

| Loader                      | Client    | Conditions                                                                   | Returns                      |
| --------------------------- | --------- | ---------------------------------------------------------------------------- | ---------------------------- |
| `loadPublicMembershipPlans` | **Admin** | Owner in rollout + has Pro; plans `is_published` + not deleted; ≥1 price row | `CustomerSubscriptionPlan[]` |

Called from `src/app/[business-slug]/page.tsx` → `BusinessProfileView` → `PublicSubscriptionsSection`.

**Tab visibility:** Subscriptions tab only if returned array is non-empty.

---

## Owner UX flows

### Create

```
/subscriptions → /new
  wizard: name → cadence(s)+price → description
  POST /api/memberships/plans
  success screen → list (refresh)
```

Component: `CreateSubscriptionPlanPage` (`mode: 'create'`).

### Edit

```
/subscriptions/[planId] → Edit → /edit
  hydrate textarea via joinDescriptionAndBenefits
  PATCH /api/memberships/plans/[planId]
  → detail
```

Same wizard (`mode: 'edit'`).

### Delete

```
Plan detail → Delete → DeleteMembershipPlanModal
  DELETE /api/memberships/plans/[planId]
  toast → /subscriptions
```

Errors (e.g. future “has subscribers”) show inside the modal.

---

## Public UX flow

```
Booking link → Subscriptions tab
  → SubscriptionPlanCard (price, cadences, description)
  → Subscribe → `/{slug}/subscribe` (explainer + first visit date)
  → Continue
       → POST /api/public/memberships/checkout
       → Stripe Checkout (mode: subscription) on Connect account
       → return /{slug}?membershipCheckout=success&planId&priceId&session_id
       → EchoBars loading → PublicMembershipSubscribeSuccess (server-rendered; no profile flash)
       → Done → /{slug}?tab=subscriptions
       → cancel → profile + toast warning
```

Body: `{ businessSlug, planId, priceId, firstVisitDate, firstVisitTime }`  
(`priceId` = `membership_plan_prices.id`; date `YYYY-MM-DD`; time `HH:mm`).  
Requires published plan, `stripe_price_id`, Pro + rollout + payments enabled + Connect ready.  
Server loads `visit_duration_minutes` from the plan, re-checks the calendar slot, and stores visit fields on Checkout session metadata.

**Webhook (live):** Connect `/api/stripe/webhook-connect` → `customer_memberships` + first-visit `bookings` row (`ensureMembershipInitialBooking`) + `membership_events` (+ invoices on `invoice.paid` / `invoice.payment_failed`).

**Emails after pay:**

1. Membership confirmation (manage/cancel portal link)
2. Appointment confirmation (same V2 booking email as public bookings)

**Live:** owner Subscribers list/detail from `customer_memberships`; calendar shows the first visit; owner gets the usual new-appointment notify.

**Period visits (owner):** Detail shows **Needs visit** when no booking is linked for `current_period_start`. Canceled and cancel-at-period-end do **not** show Needs visit (list pill stays **Canceled**); a leftover scheduled/completed visit for this period still shows. **Book visit** opens New appointment prefilled (plan name, duration, customer, notes, vehicle) with `membershipId`; on create, `linkMembershipPeriodVisit` sets `period_visit_*`. Completing that booking keeps the link (so they cannot book another visit this period) and detail shows **Visit completed** instead of **Next visit**. Cancel / delete still clears `period_visit_*` → Needs visit again. List rows show a Needs visit badge. Owner notes save via `POST …/subscribers/:id` `{ action: 'save_notes' }`.

**Period visits (customer self-serve):**

- URL: `/{slug}/membership/visit?token={membershipId}.{sig}` (`getPublicMembershipVisitPath`; same HMAC token as manage links).
- UI: subscribe-style stepper (service details → date/time) → `POST /api/public/memberships/visit` → create $0 booking + `linkMembershipPeriodVisit`. Address is prefilled and editable; vehicle is shown but locked to the membership car (server ignores a posted vehicle). Calendar opens at the next Stripe bill date (not last-visit + cadence).
- **Reminders:** on Connect `customer.subscription.updated` **when the period actually needs a visit** (not cancel / cancel-at-period-end). After upsert, if `needs_visit` and `initial_booking_id` is set and we have not already reminded for this `current_period_start` (`metadata.visit_reminder_sent_for_period_start`), send customer email + SMS with the schedule link and nudge the owner (in-app notification + push).
- **Owner Send schedule link:** `POST …/subscribers/:id` `{ action: 'send_schedule_link' }` emails/texts the same URL (when status is Needs visit). Capped at 1 send / 10 minutes per subscriber and 3 per billing period (plus an owner hourly cap).
- **Cancel / delete booking:** if that booking is `period_visit_booking_id`, clear `period_visit_*` → Needs visit again (owner can Book visit or Send schedule link).

**Invoice emails (customer):** on Connect `invoice.paid` / `invoice.payment_failed`, after ledger upsert, send branded receipt or payment-failed email (manage/update-card portal link). Idempotent via `membership_invoices.metadata.customer_email_sent_at`. Footer: “Sent for {business} via ServiceLink”.

**Still TODO:** stronger owner past-due nudges (in-app already shows status).

---

## Data flow diagram (current)

```mermaid
flowchart LR
  subgraph owner [Owner dashboard]
    UI[Create / Edit / Delete UI]
    API["/api/memberships/*"]
    UI --> API
  end

  subgraph db [Supabase]
    P[membership_plans]
    PR[membership_plan_prices]
    API --> P
    API --> PR
  end

  subgraph stripe [Stripe Connect]
    Prod[Product / Price]
    CO[Checkout subscription]
  end

  API -->|sync on save| Prod
  P -->|stripe_product_id| Prod
  PR -->|stripe_price_id| Prod

  subgraph public [Booking link]
    Page["[business-slug]/page"]
    Load[loadPublicMembershipPlans]
    Cards[PublicSubscriptionsSection]
    Page --> Load
    Load --> P
    Load --> PR
    Load --> Cards
  end

  Cards -->|Continue| CO
```

---

## Transactional logging

`membershipsTransactionLog.ts` — **warn/error only** (success is silent). Correlate with response `X-Request-ID`.

Each failure includes a short `reason` plus safe ids (`businessId`/`planId` truncated, shortened Stripe ids) and Stripe `type` / `code` / `requestId` when present. No PII. Full Stripe/Supabase messages only outside production.

## Server module cheat sheet

| File                                         | Role                                                   |
| -------------------------------------------- | ------------------------------------------------------ |
| `loadMembershipsAccess.ts`                   | Gate flags for UI                                      |
| `assertMembershipsReady.ts`                  | API hard gate                                          |
| `getBusinessStripeConnectAccountId.ts`       | Connect `acct_…` for catalog sync                      |
| `membershipsTransactionLog.ts`               | Structured logs + `X-Request-ID`                       |
| `membershipTablesQuery.ts`                   | Typed-enough `.from('membership_*')` helpers           |
| `syncMembershipPlanStripeCatalog.ts`         | Product + Price create/update; archive removed Prices  |
| `isBusinessInMembershipsRollout.ts`          | Email allowlist for business                           |
| `loadOwnerMembershipsState.ts`               | Owner plans + access                                   |
| `loadPublicMembershipPlans.ts`               | Public catalog                                         |
| `createMembershipPlan.ts`                    | Insert plan + prices + Stripe sync (rollback on fail)  |
| `updateMembershipPlan.ts`                    | Patch + DB prices + Stripe sync                        |
| `deleteMembershipPlan.ts`                    | Soft-delete + subscriber check                         |
| `countActivePlanSubscribers.ts`              | Plan + price active counts from `customer_memberships` |
| `applyMembershipCheckoutSessionCompleted.ts` | Connect checkout → member row + first booking          |
| `ensureMembershipInitialBooking.ts`          | Create calendar booking from Checkout visit metadata   |
| `applyMembershipSubscriptionLifecycle.ts`    | subscription.updated / deleted                         |
| `applyMembershipInvoiceEvent.ts`             | invoice.paid / payment_failed                          |
| `parseMembershipPlanWriteBody.ts`            | Shared create/update validation                        |
| `mapMembershipPlanRow.ts`                    | DB row → app types                                     |
| `utils/planDescription.ts`                   | split / join description + benefits                    |

---

## Stripe catalog sync (live)

On create/edit (`syncMembershipPlanStripeCatalog` via `getStripeConnectClient`):

1. Resolve Connect account from `payment_accounts`
2. Create or update Stripe **Product** → `membership_plans.stripe_product_id`
3. Create Stripe **Price** per cadence (or new Price if amount/interval changed) → `membership_plan_prices.stripe_price_id`
4. Removed cadences: archive old Stripe Price (`active: false`) best-effort, then hard-delete DB row

## Checkout + Connect webhook (live)

1. Public Continue → `createPublicMembershipCheckoutSession` (validates first-visit slot)
2. Checkout Session `mode: 'subscription'`, stored `stripe_price_id`, `{ stripeAccount }`
3. Metadata `kind: membership_checkout` (+ plan/price/business ids + `firstVisitDate` / `firstVisitTime` / `visitDurationMinutes`) on session + subscription
4. Connect webhook (`checkout.session.completed`) → upsert `customer_memberships` + `checkout_completed` event → `ensureMembershipInitialBooking` → membership confirm email + appointment confirm email
5. `customer.subscription.updated` / `deleted` → sync status / cancel fields
6. `invoice.paid` / `invoice.payment_failed` → `membership_invoices` + member payment health
