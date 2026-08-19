# Contract: Mobile — Period visit status (subscriber detail)

How the **web** owner app decides whether a subscriber **needs a visit**, has a visit **scheduled**, or the visit is **complete** for the **current Stripe billing period** — so mobile can mirror it on subscriber detail.

**Related:** field sources in [`mobile-subscriptions-phase1-data.md`](./mobile-subscriptions-phase1-data.md) (`customer_memberships` + optional `bookings` join).  
**Web source of truth:** `resolveMembershipVisitStatus` in `src/features/subscriptions/server/membershipVisitStatus.ts`  
**Mapped onto UI model:** `mapCustomerMembershipToOwnerSubscriber` → `OwnerSubscriber.visitStatus`

Phase 1 on mobile = **read + display** this state.

**Owner Book visit (create + link so the visit counts):** [`mobile-subscriptions-owner-book-visit.md`](./mobile-subscriptions-owner-book-visit.md) — same `POST /api/public/bookings` with `membershipId`; server links `period_visit_*` (no separate link call).

**Owner Send schedule link (customer self-books):** [`mobile-subscriptions-send-schedule-link.md`](./mobile-subscriptions-send-schedule-link.md) — `POST /api/memberships/subscribers/{id}` `{ "action": "send_schedule_link" }`.

**Owner Cancel subscription:** [`mobile-subscriptions-cancel.md`](./mobile-subscriptions-cancel.md) — same POST with `{ "action": "cancel_at_period_end" }` or `{ "action": "cancel_now" }`.

---

## Mental model

Each paid membership period (`current_period_start` → `current_period_end`) is allowed **one** covered visit.

| Columns on `customer_memberships` | Meaning                                                 |
| --------------------------------- | ------------------------------------------------------- |
| `period_visit_booking_id`         | Booking that counts for this period (or null)           |
| `period_visit_period_start`       | Must match `current_period_start` for the link to count |
| `current_period_start`            | Stripe period that “owns” the visit                     |

When Stripe renews, `current_period_start` advances. The old `period_visit_*` no longer matches → UI goes back to **Needs visit** (until a new booking is linked).

First subscribe: checkout webhook creates the first-visit booking and sets `period_visit_*` for the opening period — so a brand-new active subscriber usually shows **scheduled**, not needs visit.

---

## `visitStatus` values

```ts
type VisitStatus = 'needs_visit' | 'scheduled' | 'completed' | 'none';
```

| Value         | Meaning for this pay period                                                     |
| ------------- | ------------------------------------------------------------------------------- |
| `needs_visit` | Live member; no usable visit on file for this period                            |
| `scheduled`   | Linked booking exists for this period and is not completed/canceled             |
| `completed`   | Linked booking for this period has `bookings.status = completed`                |
| `none`        | Don’t show a visit section (canceled / canceling / plan removed / not eligible) |

---

## Algorithm (copy this on mobile)

Inputs from the membership row + optional booking:

```
status              // mapped owner status (active, canceled, …)
cancelScheduled     // cancel-at-period-end / cancel_at in future (see phase1-data)
planRemoved         // plan soft-deleted and membership not “live”
current_period_start
period_visit_booking_id
period_visit_period_start
booking.status      // from bookings where id = period_visit_booking_id (if any)
booking.scheduled_date  // YYYY-MM-DD
booking.start_time      // HH:mm…
```

```
linkedThisPeriod =
  period_visit_booking_id is set
  AND period_visit_period_start and current_period_start
      are the same instant (parse as Date, compare getTime())

if linkedThisPeriod:
  if booking.status is "completed"     → visitStatus = "completed"
  else if booking.status is "cancelled" or "canceled"
                                       → treat as NOT on file (fall through)
  else                                 → visitStatus = "scheduled"

if not on file:
  eligible =
    status in (active, trialing, past_due, unpaid, paused)
    AND NOT cancelScheduled
    AND NOT planRemoved
  if eligible → visitStatus = "needs_visit"
  else        → visitStatus = "none"
```

**Period start match tip:** compare timestamps, not raw strings — Stripe/ISO strings can differ in format but represent the same instant.

**Display fields when scheduled/completed:**

```
periodVisitBookingId = period_visit_booking_id   // only if scheduled|completed
periodVisitDate      = booking.scheduled_date    // YYYY-MM-DD
periodVisitTime      = booking.start_time[0:5]   // HH:mm
```

If not `scheduled`/`completed`, clear those three on the UI model (web does this so stale IDs don’t leak).

---

## Suggested Supabase read (subscriber detail)

```sql
-- membership
select
  id,
  status,
  cancel_at_period_end,
  cancel_at,
  current_period_start,
  current_period_end,
  period_visit_booking_id,
  period_visit_period_start,
  plan_id,
  -- …other subscriber fields…
from customer_memberships
where id = :membershipId
  and business_id = :businessId;

-- plan still live?
select id, deleted_at, visit_duration_minutes, name
from membership_plans
where id = :planId;

-- period visit booking (only if period_visit_booking_id is set)
select id, scheduled_date, start_time, status
from bookings
where id = :periodVisitBookingId
  and business_id = :businessId;
```

Then run the algorithm above locally (same as web mapper).

---

## Subscriber detail UI (match web)

Only render a **Visit** block when `visitStatus !== 'none'`.

| `visitStatus` | Section title | Primary copy                                         | Secondary                                               |
| ------------- | ------------- | ---------------------------------------------------- | ------------------------------------------------------- |
| `needs_visit` | Next visit    | **Needs a visit this period**                        | “Book it yourself, or send them a link to pick a date.” |
| `scheduled`   | Next visit    | **{date} · {time}** (e.g. Thursday, Aug 2 · 9:00 AM) | “Need to rebook? Cancel it in Bookings first.”          |
| `completed`   | This period   | **Visit complete**                                   | Date · time (or “Done this period”)                     |

**List badge (optional, same priority as web):** if the row isn’t past_due/canceled, and `visitStatus === 'needs_visit'`, show a **Needs visit** pill instead of plain Active.

Web actions (later on mobile):

- `needs_visit` → **Book visit** (owner create appointment with `membershipId`) + **Send schedule link**
- `scheduled` / `completed` → open that booking / Bookings list

---

## State transitions (what moves the needle)

```
[needs_visit]
    │  owner books + linkMembershipPeriodVisit
    │  OR customer books via public schedule link
    │  OR first visit from subscribe webhook
    ▼
[scheduled]  ──complete booking──►  [completed]
    │
    │  cancel / delete that booking
    │  (clears period_visit_* on membership)
    ▼
[needs_visit]

[any] ──Stripe period advances (current_period_start changes)──► [needs_visit]
       (old period_visit_period_start no longer matches)

[active…] ──cancel scheduled / canceled / plan removed──► [none]
            (unless a leftover scheduled/completed visit is still linked THIS period
             — then still show scheduled/completed)
```

Important edge cases web already handles:

1. **Cancel-at-period-end** → `visitStatus` is `none` (do **not** nag Needs visit), unless a visit is already linked for this period.
2. **Canceled booking** linked as period visit → treated as not on file → usually back to `needs_visit`.
3. **Completed** keeps the link so they can’t book a second visit this period until renewal.

---

## What mobile still needs separately

- **Send schedule link** API (owner resend) — not covered here; web: `POST /api/memberships/subscribers/:id` `{ action: 'send_schedule_link' }`
- Public customer self-schedule page — separate flow

Owner **Book visit** create + period link is documented in [`mobile-subscriptions-owner-book-visit.md`](./mobile-subscriptions-owner-book-visit.md).

---

## Quick checklist for mobile

- [ ] Join `bookings` when `period_visit_booking_id` is set
- [ ] Implement `resolveMembershipVisitStatus` (or port the algorithm above)
- [ ] Hide visit section when `none`
- [ ] Show amber “Needs a visit this period” for `needs_visit`
- [ ] Show date/time for `scheduled`
- [ ] Show “Visit complete” + date for `completed`
- [ ] After Stripe renews in test, confirm UI flips back to needs visit
- [ ] Book visit: `jobs[]` + `membershipId` + `paymentMethodSelected: "membership"` (see owner-book-visit contract)
