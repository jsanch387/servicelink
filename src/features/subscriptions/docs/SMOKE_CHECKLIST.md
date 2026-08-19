# Memberships — smoke checklist (round 2)

Run in order. Tick as you go. Dump anything weird in [SMOKE_TEST_FOLLOWUPS.md](./SMOKE_TEST_FOLLOWUPS.md) Inbox.

Skip Stripe Test Clocks / “fake next month” this round. Renewal charge + reminder emails wait for a real next-bill date.

**Before you start:** `npm run dev`, Stripe test mode, `stripe listen` forwarding Connect events to `/api/stripe/webhook-connect`, a phone that can get SMS.

Use a **new** test email (`you+r2@…`) and a **new** plan name so leftover Test Sub / canceled rows don’t confuse counts.

---

## A. Owner — plan

- [ x] Create a plan (name, duration, at least monthly $). It shows on Plans and on the booking link.
- [ x] Edit copy / price. Public card updates.
- [x ] Plan card says **0 subscribers** / **No subscribers yet**.
- [ x] Delete is allowed while nobody is subscribed.

---

## B. Customer — subscribe (full UI)

From the booking link → Subscriptions → Subscribe:

- [ x] Pick first visit date + time (slot is real on the calendar).
- [ x] Address + vehicle (mobile). Shop-only: vehicle only.
- [ ] Contact step: SMS consent checkbox checked by default; can uncheck.
- [ ] Unchecking SMS consent → `customers.sms_opt_in = false` after pay (no confirmation SMS).
- [ x] Stripe Checkout with `4242`. Success screen, then Done.
- [ x] Email: membership confirmation (manage/cancel link).
- [ x] Email: appointment confirmation — **Covered by membership**, not collect-in-person.
- [ x] SMS: booking confirmed (if phone was entered).

---

## C. Owner — after subscribe

- [ x] Plans: that plan shows **1 subscriber**. Subscribers tab matches (current list, not canceled history).
- [ x] Subscriber detail: Active, next bill date, plan name, no **Needs visit** (first visit is already booked).
- [ x] Calendar / Bookings: first visit is there.
- [ x] Booking detail: customer, address, vehicle, payment **Membership** (not collect in person).
- [ x] Owner got the usual new-appointment notify.

---

## D. Appointments — complete / cancel / rebook

**Complete the first visit**

- [ x] Mark the job complete.
- [ x] Subscriber detail: **Visit complete** (not still Next visit / Needs visit).
- [ x] Public receipt + job-complete email: **Covered by membership**.

**Cancel the visit (use a second subscribe, or cancel this one after complete isn’t available — cancel an upcoming visit)**

If this period’s visit is still upcoming:

- [ x] Cancel (or delete) that booking in Bookings.
- [ x] Subscriber detail back to **Needs visit**.
- [ x] List pill: **Needs visit** (not Active).
- [ x] **Send schedule link** → customer email + SMS. Link opens public visit stepper.
- [ x] Public visit: address editable, vehicle locked, calendar is **one cadence** from period start (weekly / every 2 weeks / monthly). Canceled visits stay in this cycle.
- [ x] Book a new slot. Detail: **Visit scheduled**. Booking is $0 / membership.

**Owner Book visit** (instead of send link, on a Needs visit row):

- [ x] Prefills name, email, phone, plan duration, vehicle, address.
- [ x] Creating it links the period visit. Needs visit clears.

**Known gap — don’t file as new:** no reschedule without cancel + rebook. **Visit scheduled** doesn’t deep-link to that booking.

---

## E. Cancel membership (keep the appointment test separate)

Do this on a member who **still has an upcoming visit**.

- [ x] Customer: manage link → cancel **at period end**.
- [ x] Owner: status **Canceled**, **Next bill** —, banner **access until** {date}, **not** Needs visit. Appears under **Canceled** filter (not Active).
- [ x] No “book next visit” email/SMS from that cancel.
- [ x] Customer gets a **subscription canceled** confirmation email (access until {date} when cancel-at-period-end).
- [ x] Upcoming appointment is **still on the calendar** (known gap: we don’t auto-cancel it).
- [ x] Cancel that leftover appointment yourself. Calendar is clean.

Optional:

- [ x] Owner `⋯` → cancel at period end — same Canceled / Next bill — / access-until banner; under **Canceled** filter.
- [ x] Fully canceled (cancel now): status **Canceled**, **Next bill** —, no access-until banner.
- [ x] Canceled people (period-end or immediate) are **not** in the default **Active** list. **Canceled** (or **Ended**) filter pill still finds them.

---

## F. Plan delete + list sanity

- [ x] Delete a plan that still has **active or cancel-at-period-end** members → blocked.
- [ ] After everyone on a plan is fully canceled, delete the plan. Those people show under ended as **{plan} (removed)** or **Removed plan**, history copy, no “access until” as if they’re live.
- [ x] Current Subscribers count on the plan card matches **Active** filter (cancel-at-period-end does not inflate it).

---

## G. Extra if you have time

- [ ] Same phone as an existing customer → reuse CRM, no duplicate customer.
- [ ] Owner notes on subscriber detail save.
- [ ] Send schedule link twice quickly → throttled (wait / cap message).
- [ ] Failed card / past due — skip unless you’re set up for it.

---

## Skip this round

- Stripe Test Clocks / skip-to-next-month
- Renewal invoice paid/failed emails (need a real next bill)
- Period reminder on renewal
- Preferred day/time (not built)
- Owner phone ping on new subscribe (not built)

---

## Capture

Pass/fail per line is enough. New bugs → [SMOKE_TEST_FOLLOWUPS.md](./SMOKE_TEST_FOLLOWUPS.md) Inbox with: what you clicked, what you expected, what you got.
