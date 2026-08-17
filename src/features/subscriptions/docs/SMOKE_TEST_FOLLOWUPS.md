# Memberships — smoke test follow-ups

Living list of gaps / polish from local testing. Check items off as they ship. Add new notes at the bottom under **Inbox**.

**Round-2 run-through:** [SMOKE_CHECKLIST.md](./SMOKE_CHECKLIST.md)

Last updated: 2026-08-14

---

## Customer / booking data

Revisit subscribe + first/period visit booking payload end-to-end — several fields never land, so booking detail looks wrong for membership jobs.

- [x] **Address missing on membership subscribe / period visit** — subscribe + public rebook ask only when missing; shop-only skips customer address; CRM/checkout metadata → booking
- [x] **Vehicle never captured on subscribe** — same path as address (ask gaps / silent reuse → metadata → initial + period bookings)
- [x] **Reuse existing customer address + vehicle** — phone→email match same business; public rebook stepper prefills address (editable) + vehicle (locked); owner Book visit prefills from same resolver
- [x] **Payment on booking detail wrong** — membership visits store `payment_method_selected: membership` and show Membership (not Collect in person). Legacy $0 rows show No charge.
- [x] **Vehicle on public membership book** — public visit + subscribe + owner Book visit share CRM snapshot resolver

### Address / vehicle / payment plan (notes)

1. **V1:** On public visit book (and maybe subscribe), if email/phone matches existing customer → use their address (+ vehicle) silently when mobile
2. **V2:** If no match / incomplete → short address (and vehicle?) step before confirming slot
3. Shop-only businesses can keep skipping customer address
4. Membership-covered bookings: set payment method / display so owner UI doesn’t say collect in person

### Smart CRM reuse (existing customer → subscriber)

**Match order (same business only):**

1. Normalized phone (primary — SMS / booking identity)
2. Else normalized email
3. Never cross-business

**On match, pull (prefer latest complete):**

- Service address from latest booking with a street (or customer profile if we store one)
- Vehicle from latest `customer_assets` vehicle, else latest booking vehicle columns
- Link `customer_memberships.customer_id` to that CRM row (don’t create a duplicate)

**UX — subscribe vs rebook:**

- **Subscribe:** CRM match prefills address/vehicle; **always show** details so they can confirm/edit (banner when prefilled)
- **Public rebook:** same stepper as subscribe (details → calendar). Address is prefilled and editable. Vehicle is shown but locked (plan is for that car). Shop-only: locked vehicle, then calendar.
- Shop-only: vehicle fields only (skip customer address)

**Wire into create:**

- Prefer `createBookingForExistingCustomer` / latest-booking snapshot helpers already used by maintenance enroll
- Owner Book visit: keep vehicle prefill; add address prefill from same resolver
- Checkout metadata / webhook must carry or re-resolve CRM snapshot so first visit isn’t empty

**Don’t:**

- Blind-create a second `customers` row for the same phone
- Overwrite a good CRM address with blanks from Stripe
- Force re-entry every period if data already on the membership/customer

---

## Visit / period loop

- [x] Cancel booking → Needs visit again
- [x] Complete period visit → Visit completed (not still “Next visit”)
- [x] Send schedule link (email/SMS)
- [ ] **Deep link from “Visit scheduled” → that booking** (not just Bookings list)
- [ ] **Reschedule period visit** without cancel + rebook
- [ ] **Customer follow-up** if they never pick a date after Needs visit (beyond first renewal reminder)
- [ ] **Cancel membership → cancel leftover period visit** — customer still has to cancel the appointment themselves
- [x] **Cancel must not send “book next visit”** — `subscription.updated` from Customer Portal cancel was firing the period-start reminder + SMS. Skip when canceling / canceled.
- [x] **Canceled UI must not say Needs visit** — cancel-at-period-end is still Stripe `active`, so the list pill was preferring Needs visit over Canceled. Visit status is `none` unless a leftover appointment is already on file.
- [x] **Period visit dates follow billing period** — public rebook opens at next bill (Stripe period end), not last visit + a month. August visit stays closed; Sep 13–14 is bookable. Server rejects dates outside that window.
- [ ] **V2: preferred day/time** — remember first-visit weekday + time and auto-offer that slot each period (less picking). Don’t build until the loop is shipping.

---

## Owner UX

- [ ] **Subscribers filters** — Needs visit / past due / canceling (canceled history is behind Active / Canceled pills)
- [x] **Subscribers tab vs plan count** — tab defaults to **Active** (no cancel requested). Cancel-at-period-end + fully canceled / ended / removed-plan behind **Canceled** / **Ended**. Plan-card active count matches (cancel requested → not counted). Removed plan detail says history, not “access until”.
- [ ] **Cancel UX** — re-verify toast + immediate UI after cancel (idempotent fix landed; confirm in smoke)
- [x] **Next bill vs Access until** — canceled (including cancel-at-period-end) keeps **Next bill** with no date; access until lives on the banner / tooltip (amber Canceled pill)
- [ ] **Owner past-due nudge** for memberships (customer failed email exists; owner still light)
- [x] Better loading skeleton on subscriber detail

---

## Notifications

- [ ] **Owner phone alert on new subscribe** — milestone ping when someone joins (SMS vs voice TBD). Fire from same subscribe-confirm path as the customer email; reuse existing owner notify plumbing if any. Don’t code yet.
- [x] **US +1 phone input** — PhoneInput shows locked US +1; forms store 10 national digits; SMS `toE164` always adds +1 (Telnyx). Multi-country later.
- [x] **Membership booking confirmation email copy** — payment is a full-width “Covered by membership” statement (no em-dash row); generic “Membership visit.” notes omitted from the email
- [x] **Membership job-complete receipt** — public receipt + email say Covered by membership (no $0.00 Charges jumble)

---

## Billing / Stripe

- [ ] **Invoice paid/failed emails** — confirm on renewal (not first checkout)
- [ ] **Period reminder** — confirm Test Clock / period SQL + `subscription.updated`
- [ ] **Soft-delete plan with active members** — confirm 409
- [x] Owner cancel write path uses admin client (RLS)
- [x] Cancel idempotent + UI refresh (no stale Active + “Already canceled” toast)

---

## Inbox (add raw notes here)

<!-- Paste observations while testing; promote into checkboxes above when clear. -->

- New subscribe → owner phone notification (promoted above; keep simple + milestone-feeling)
- Subscribe booking payload gaps: no vehicle, no address, payment shows collect in person (promoted above — revisit as one payload pass)
- Membership booking email: $0 total OK; payment is a full-width “Covered by membership” statement; generic “Membership visit.” notes omitted from the email
-
