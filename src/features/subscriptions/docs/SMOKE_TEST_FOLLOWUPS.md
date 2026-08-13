# Memberships — smoke test follow-ups

Living list of gaps / polish from local testing. Check items off as they ship. Add new notes at the bottom under **Inbox**.

Last updated: 2026-08-12

---

## Customer / booking data

Revisit subscribe + first/period visit booking payload end-to-end — several fields never land, so booking detail looks wrong for membership jobs.

- [x] **Address missing on membership subscribe / period visit** — subscribe + public rebook ask only when missing; shop-only skips customer address; CRM/checkout metadata → booking
- [x] **Vehicle never captured on subscribe** — same path as address (ask gaps / silent reuse → metadata → initial + period bookings)
- [x] **Reuse existing customer address + vehicle** — phone→email match same business; silent “Using your saved details” when complete; owner Book visit prefills from same resolver
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
- **Public rebook:** if address/vehicle already complete → **date/time only** (reuse CRM silently); only show details form for gaps
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
- [x] Send schedule link (email/SMS)
- [ ] **Deep link from “Visit scheduled” → that booking** (not just Bookings list)
- [ ] **Reschedule period visit** without cancel + rebook
- [ ] **Customer follow-up** if they never pick a date after Needs visit (beyond first renewal reminder)

---

## Owner UX

- [ ] **Subscribers filters** — Needs visit / past due / canceling / canceled
- [ ] **Cancel UX** — re-verify toast + immediate UI after cancel (idempotent fix landed; confirm in smoke)
- [ ] **Next bill vs Access until** — canceled shows `—`; cancel-at-period-end shows Access until
- [ ] **Owner past-due nudge** for memberships (customer failed email exists; owner still light)
- [x] Better loading skeleton on subscriber detail

---

## Notifications

- [ ] **Owner phone alert on new subscribe** — milestone ping when someone joins (SMS vs voice TBD). Fire from same subscribe-confirm path as the customer email; reuse existing owner notify plumbing if any. Don’t code yet.
- [x] **US +1 phone input** — PhoneInput shows locked US +1; forms store 10 national digits; SMS `toE164` always adds +1 (Telnyx). Multi-country later.
- [ ] **Membership booking confirmation email copy** — total $0 is fine; clean up payment box (“Covered by membership”) and notes that always say “memberships first visit” (wrong for later period visits too). Don’t code yet.

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
- Membership booking email: $0 total OK; “Covered by membership” payment box + “first visit” notes feel wrong for later visits (promoted above — don’t code yet)
-
