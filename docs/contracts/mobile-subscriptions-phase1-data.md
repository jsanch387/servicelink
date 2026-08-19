# Contract: Mobile — Subscriptions phase 1 data & queries

Tables live in Supabase. Owners **SELECT** their own rows via RLS (`business_id` → `business_profiles.profile_id = auth.uid()`).  
`customer_memberships` is **SELECT-only** for owners; webhooks / service role do writes.

---

## Entity diagram (owner read path)

```
business_profiles (your business)
        │
        ├── membership_plans          (deleted_at IS NULL for catalog)
        │         └── membership_plan_prices
        │
        └── customer_memberships      (subscribers)
                  │
                  ├── plan_id → membership_plans (may be soft-deleted)
                  └── period_visit_booking_id → bookings (optional join)
```

Secondary (don’t need for Phase 1 lists): `membership_events`, `membership_invoices`.

---

## Table: `membership_plans`

| Column                      | Type         | Notes                                          |
| --------------------------- | ------------ | ---------------------------------------------- |
| `id`                        | uuid         | PK                                             |
| `business_id`               | uuid         | Your business                                  |
| `name`                      | text         |                                                |
| `description`               | text         | Full owner copy (prose + bullets in one field) |
| `is_published`              | boolean      | Public link; owner list ignores for now        |
| `is_popular`                | boolean      | Rarely used                                    |
| `sort_order`                | integer      | List order                                     |
| `visit_duration_minutes`    | integer      | 30–630, step 30                                |
| `stripe_product_id`         | text?        | Ignore for Phase 1 UI                          |
| `deleted_at`                | timestamptz? | **null = live plan**                           |
| `created_at` / `updated_at` | timestamptz  |                                                |

**Phase 1 query — plans for home:**

```sql
select *
from membership_plans
where business_id = :businessId
  and deleted_at is null
order by sort_order asc, created_at asc;
```

---

## Table: `membership_plan_prices`

| Column            | Type    | Notes                       |
| ----------------- | ------- | --------------------------- |
| `id`              | uuid    | PK                          |
| `plan_id`         | uuid    | FK plan                     |
| `business_id`     | uuid    | Denormalized                |
| `interval_unit`   | text    | `week` \| `month` \| `year` |
| `interval_count`  | int     | e.g. 2 + week = biweekly    |
| `price_cents`     | int     |                             |
| `currency`        | text    | usually `usd`               |
| `is_default`      | boolean | Preferred cadence on card   |
| `stripe_price_id` | text?   | Ignore for Phase 1 UI       |

**Phase 1 query — prices for those plans:**

```sql
select *
from membership_plan_prices
where business_id = :businessId
  and plan_id in (:planIds);
```

Cadence label helpers (match web):

| interval_unit | interval_count | Label             |
| ------------- | -------------- | ----------------- |
| week          | 1              | Weekly            |
| week          | 2              | Every 2 weeks     |
| month         | 1              | Monthly           |
| year          | 1              | Yearly            |
| other         | n              | Every {n} {unit}s |

Default price on card: row with `is_default = true`, else first by create order.

---

## Table: `customer_memberships`

| Column                                          | Type         | Notes for UI                                                                                  |
| ----------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------- |
| `id`                                            | uuid         | **Subscriber id** in mobile routes                                                            |
| `business_id`                                   | uuid         |                                                                                               |
| `plan_id`                                       | uuid?        | Null / deleted plan → `planRemoved`                                                           |
| `plan_price_id`                                 | uuid?        |                                                                                               |
| `customer_id`                                   | uuid?        | CRM link                                                                                      |
| `customer_name`                                 | text?        | Display name (fallback email local-part)                                                      |
| `customer_email`                                | text?        |                                                                                               |
| `customer_phone`                                | text?        |                                                                                               |
| `status`                                        | text         | Stripe-ish: `active`, `trialing`, `past_due`, `unpaid`, `paused`, `canceled`, `incomplete`, … |
| `amount_cents`                                  | int          |                                                                                               |
| `currency`                                      | text         |                                                                                               |
| `interval_unit` / `interval_count`              |              | Cadence on the membership                                                                     |
| `current_period_start`                          | timestamptz? | Visit period key                                                                              |
| `current_period_end`                            | timestamptz? | Access / next bill candidate                                                                  |
| `cancel_at_period_end`                          | boolean      |                                                                                               |
| `cancel_at`                                     | timestamptz? | Portal often sets this instead of flag                                                        |
| `canceled_at` / `ended_at`                      | timestamptz? |                                                                                               |
| `last_invoice_status`                           | text?        | For “Paid …” label                                                                            |
| `payment_method_brand` / `payment_method_last4` |              | Card on file                                                                                  |
| `notes`                                         | text?        | Owner-only                                                                                    |
| `initial_booking_id`                            | uuid?        | First visit booking                                                                           |
| `period_visit_booking_id`                       | uuid?        | This period’s visit booking                                                                   |
| `period_visit_period_start`                     | timestamptz? | Must match `current_period_start` to count                                                    |
| `created_at`                                    | timestamptz  | “Started”                                                                                     |
| `metadata`                                      | jsonb        | Ignore for Phase 1 display                                                                    |

**Phase 1 query — all subscribers:**

```sql
select *
from customer_memberships
where business_id = :businessId
order by created_at desc;
```

**Optional — period visit booking fields:**

```sql
select id, scheduled_date, start_time, status
from bookings
where id in (:periodVisitBookingIds)
  and business_id = :businessId;
```

Use when `period_visit_booking_id` is set. Needed for date/time on “Visit scheduled / complete” and to know if booking is `completed` vs cancelled.

**Plans map for names / removed:**

Join or second query `membership_plans` including soft-deleted (`deleted_at not null`) so canceled history can show `{name} (removed)`.

```
planRemoved = plan_id is null OR plan.deleted_at is not null
planName    = plan.name or "Plan" / "Removed plan"
```

---

## Derived fields (implement on device)

Port these rules; web sources are cited.

### 1) `cancelScheduled` (treat as canceled for UI)

```
if status in (canceled, cancelled, incomplete_expired) → false
else if cancel_at_period_end === true → true
else if cancel_at is a future timestamp → true
else → false
```

Web: `isMembershipCancelScheduled` in `mapCustomerMembershipToOwnerSubscriber.ts`.

Expose to UI as `cancelAtPeriodEnd: cancelScheduled` (web naming is a bit overloaded — it means “cancel is scheduled”, not only Stripe’s boolean).

### 2) Owner `status` enum

Map DB `status` →:

`active` | `trialing` | `past_due` | `unpaid` | `paused` | `canceled` | `incomplete`

- `cancelled` / `incomplete_expired` → `canceled`
- unknown → `incomplete`

### 3) Status pill label

```
if cancelScheduled → "Canceled"          // amber
else → label from status map              // Active, Past due, …
```

List priority (one pill only):

1. If past_due/unpaid → that pill
2. Else if cancelScheduled or status canceled → Canceled
3. Else if visitStatus === needs_visit → **Needs visit**
4. Else normal status label

### 4) `visitStatus`

**Full mobile contract (UI + algorithm + transitions):** [`mobile-subscriptions-period-visit.md`](./mobile-subscriptions-period-visit.md).

```
linkedThisPeriod =
  period_visit_booking_id set
  AND period_visit_period_start ≈ current_period_start (same instant)

if linkedThisPeriod:
  booking.status completed → "completed"
  booking.status cancelled/canceled → treat as not on file
  else → "scheduled"

if not on file:
  if status eligible (active|trialing|past_due|unpaid|paused)
     AND NOT cancelScheduled
     AND NOT planRemoved
    → "needs_visit"
  else → "none"
```

Web: `resolveMembershipVisitStatus` in `membershipVisitStatus.ts`.

### 5) Active list vs Canceled list

```
isActiveList =
  status in (active, trialing, past_due, unpaid, paused)
  AND NOT planRemoved
  AND NOT cancelScheduled

isCanceledList = !isActiveList
```

### 6) Plan card subscriber count

Count of `customer_memberships` for that `plan_id` where `isActiveList` is true.

### 7) Next bill display

```
if status === canceled → "—"
if cancelScheduled → "—"   // access until goes on banner / tooltip only
else → date from cancel_at ?? current_period_end (date only)
```

### 8) Payment method label

```
if brand + last4 → "{Brand} ••{last4}"
else null
```

### 9) Last payment label

From `last_invoice_status` / paid date if you have it — optional. Web often shows `Paid {Mon D}` when paid.

---

## Suggested TypeScript shapes (Phase 1)

Align with web `OwnerSubscriptionPlan` / `OwnerSubscriber` where possible.

```ts
type CadenceUnit = 'week' | 'month' | 'year';

type OwnerSubscriberStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'unpaid'
  | 'paused'
  | 'canceled'
  | 'incomplete';

type VisitStatus = 'needs_visit' | 'scheduled' | 'completed' | 'none';

type MobileSubscriptionPlan = {
  id: string;
  name: string;
  /** Full copy including any bullets. */
  description: string;
  visitDurationMinutes: number;
  cadenceOptions: Array<{
    id: string;
    intervalUnit: CadenceUnit;
    intervalCount: number;
    priceCents: number;
    isDefault?: boolean;
  }>;
  /** Active-list count only */
  activeSubscriberCount: number;
  createdAt: string;
};

type MobileSubscriber = {
  id: string;
  customerName: string;
  email: string;
  phone?: string;
  customerId?: string | null;
  planId: string;
  planName: string;
  planRemoved?: boolean;
  visitDurationMinutes?: number;
  cadenceLabel: string;
  intervalUnit: CadenceUnit;
  intervalCount: number;
  amountCents: number;
  status: OwnerSubscriberStatus;
  /** YYYY-MM-DD */
  startedAt: string;
  /** YYYY-MM-DD or null */
  nextBillingAt: string | null;
  /** true when cancel is scheduled (access until nextBillingAt / period end) */
  cancelAtPeriodEnd?: boolean;
  lastPaymentLabel?: string;
  paymentMethodLabel?: string;
  notes?: string | null;
  visitStatus: VisitStatus;
  periodVisitBookingId?: string | null;
  periodVisitDate?: string | null; // YYYY-MM-DD
  periodVisitTime?: string | null; // HH:mm
};
```

---

## Optional HTTP reads (same web app)

If you prefer normalized JSON instead of joining tables:

| Purpose                   | Endpoint                                   |
| ------------------------- | ------------------------------------------ |
| Plans + active counts     | `GET /api/memberships/plans`               |
| All / by-plan subscribers | `GET /api/memberships/subscribers?planId=` |
| One subscriber            | `GET /api/memberships/subscribers/:id`     |

```http
Authorization: Bearer <supabase_access_token>
```

Success shapes: `{ success: true, plans: OwnerSubscriptionPlan[] }` / `{ success: true, subscribers: OwnerSubscriber[] }` / `{ success: true, subscriber: OwnerSubscriber }`.

Phase 1 can ignore these if direct Supabase reads are enough — the mapping above matches what those endpoints return.

---

## RLS reminder

| Table                    | Owner                                                  |
| ------------------------ | ------------------------------------------------------ |
| `membership_plans`       | SELECT/INSERT/UPDATE/DELETE own (Phase 1: SELECT only) |
| `membership_plan_prices` | Same                                                   |
| `customer_memberships`   | **SELECT only**                                        |
| `bookings`               | Existing owner booking policies                        |

---

## Quick load recipe (Phase 1)

1. Resolve `businessId` for the signed-in owner (you already do this elsewhere).
2. Fetch plans (`deleted_at is null`) + prices.
3. Fetch all `customer_memberships` for `businessId`.
4. Fetch soft-deleted plans referenced by memberships (for names / `planRemoved`).
5. Fetch `bookings` for non-null `period_visit_booking_id`s.
6. Map → `MobileSubscriptionPlan` / `MobileSubscriber` with derived fields.
7. Render screens; stub writes.

That’s enough to display everything web shows in read mode.

**Writes (separate contracts):** send schedule link, book visit, cancel appointment, [cancel subscription](./mobile-subscriptions-cancel.md).
