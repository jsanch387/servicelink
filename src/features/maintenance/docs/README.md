# Maintenance enrollment (maintenance detail)

Product documentation for the **maintenance enrollment** flow: a business invites an existing customer to a recurring **maintenance detail** (price, cadence, first visit), the customer opens a magic link, sets or confirms their first visit, pays or commits to pay in person, and the first visit lands on the owner’s calendar.

This doc is safe for version control: **no secrets**, API keys, webhook signing secrets, raw invite tokens, or production URLs.

---

## Automated tests

Vitest specs live under **`src/features/maintenance/testing/`** (see `vitest.config.ts` include glob). They cover:

- Service display / calendar titles (`maintenanceDetailServiceLabel`)
- Anchor placeholder vs real schedule (`hasMaintenanceAnchorScheduled`)
- Card paid detection (`maintenanceEnrollmentPaymentStatus`)
- Public payment option matrix (`maintenancePaymentEligibility`)
- CRM chip, block-new-invite, subtitle, anchor display (`customerMaintenanceEnrollmentLabels` via `maintenanceEnrollmentCrmLabels.test.ts`)
- Invite URL builder (`buildMaintenanceInviteCustomerUrl`)

Run: `npm run test`. API routes, Stripe webhooks, and Supabase-backed flows are not integration-tested here yet—add those when you introduce a test DB or HTTP mocks.

---

## Where the code lives

| Area                                | Location                                                                   |
| ----------------------------------- | -------------------------------------------------------------------------- |
| Feature entry (UI + server helpers) | `src/features/maintenance/`                                                |
| Owner enroll API                    | `src/app/api/maintenance/enrollments/route.ts`                             |
| Customer public APIs                | `src/app/api/public/maintenance-enrollment/*`                              |
| Customer page                       | `src/app/maintenance/e/[token]/page.tsx`                                   |
| Stripe maintenance branch           | `src/app/api/stripe/webhook/route.ts` (metadata-driven branch)             |
| CRM wiring                          | `src/features/customer-management/` (loads latest enrollment per customer) |
| Invite / confirmation emails        | `src/features/email/maintenance-enrollment-*`                              |

---

## End-to-end flows

### A. Business owner (CRM)

1. Open a customer → **Send maintenance invite** (inverse CTA).
2. Enter price, visit duration; optionally **first visit date/time** (or leave blank so the customer picks on the link).
3. Submit → `POST /api/maintenance/enrollments` creates a `maintenance_enrollments` row, stores a **hashed** link token and (when migrated) a **server-side copy** of the raw token for “copy link again,” emails the customer when an email exists, and returns the public URL for manual copy.
4. While the invite is **pending** and a stored invite token exists, **Send maintenance invite** is disabled to avoid overlapping invites; **View details** exposes **Copy invite link** for SMS / no-email customers.
5. After the customer completes the flow, CRM shows status (pending → confirmed, payment line, etc.).

### B. Customer (magic link)

1. Open `/maintenance/e/{token}` (token is opaque; do not log in production analytics as PII).
2. If no real first-visit anchor yet → **Maintenance date** form → `POST /api/public/maintenance-enrollment/anchor` (slot check).
3. Payment options depend on business **payment settings** and Connect readiness (see `maintenancePaymentEligibility.ts`):
   - **Pay in person** → `POST /api/public/maintenance-enrollment/confirm` after anchor exists.
   - **Pay with card** → `POST /api/public/maintenance-enrollment/checkout` → Stripe Checkout → return URL → `checkout.session.completed` webhook marks enrollment paid/accepted and runs booking ensure.
4. Confirmation email (when applicable) is sent once dedupe allows (see **Database**).

---

## Database: `maintenance_enrollments` (conceptual)

The app expects a row per “invite” (latest per customer is what CRM loads). Important fields (names may vary slightly by migration; align with Supabase):

| Concern                                                                       | Purpose                                                                                                                     |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `business_id`, `customer_id`                                                  | Ownership and CRM join.                                                                                                     |
| `status`                                                                      | e.g. pending customer vs accepted vs terminal states.                                                                       |
| `payment_status`, `customer_selected_payment`                                 | Card vs pay-in-person vs pending.                                                                                           |
| `service_name_snapshot`, `price_cents`, `duration_minutes`, `frequency_weeks` | Plan snapshot.                                                                                                              |
| `anchor_date`, `anchor_time`                                                  | First visit; placeholder sentinel used when DB required NOT NULL but no real date yet (`hasMaintenanceAnchorScheduled.ts`). |
| `customer_link_token_hash`                                                    | Public lookup from URL token (hash only in DB).                                                                             |
| `customer_invite_token`                                                       | Optional: raw token for owner “copy link again” (run migration if missing).                                                 |
| `stripe_checkout_session_id`                                                  | Last Checkout session written by checkout API (see **Follow-ups**).                                                         |
| `initial_booking_id`                                                          | Idempotent link to first `bookings` row after acceptance.                                                                   |
| `confirmation_email_sent_at`                                                  | Dedupes post-acceptance confirmation email (`sql/add_maintenance_enrollment_confirmation_email_sent_at.sql`).               |
| `email_sent_at`, `last_notification_error`                                    | Invite email telemetry.                                                                                                     |

**Related tables:** `bookings`, `booking_payments` (first visit), `customers`, `business_profiles`, payment settings / accounts (read for eligibility).

---

## Server behavior (short)

- **Slot checks:** Anchor save, pay-in-person confirm, card checkout start, and first booking creation use shared calendar conflict logic (`checkMaintenanceAnchorAgainstCalendar.ts`).
- **First calendar booking:** `ensureMaintenanceEnrollmentInitialBooking.ts` runs after acceptance; idempotent via `initial_booking_id`; handles race (orphan booking deleted if link lost).
- **Owner notify:** `notifyOwnerForMaintenanceInitialBooking.ts` reuses the same pipeline as availability booking notifications once a booking exists.
- **Visit completion counter:** `applyMaintenanceVisitCompletedFromBooking.ts` (invoked when a booking is completed) can bump customer maintenance visit stats when linked to an enrollment.

---

## HTTP surface (reference)

- `POST /api/maintenance/enrollments` — authenticated owner; creates enrollment + invite.
- `POST /api/public/maintenance-enrollment/anchor` — customer; sets first visit.
- `POST /api/public/maintenance-enrollment/checkout` — customer; starts Stripe Checkout.
- `POST /api/public/maintenance-enrollment/confirm` — customer; pay in person path.
- Stripe webhook — `checkout.session.completed` with maintenance metadata updates enrollment and triggers ensure + confirmation email.

Do **not** document Stripe webhook signing, Supabase service-role keys, or Resend keys in this file; configure those only in deployment secrets.

---

## Migrations in repo

- `sql/add_maintenance_enrollment_confirmation_email_sent_at.sql` — confirmation email dedupe.

Additional columns (e.g. invite token storage) may exist in your database from earlier migrations; keep **repo SQL** and **production schema** in sync before deploy.

---

## Follow-ups (prioritized — not required for initial testing)

1. **Multiple Checkout sessions** — Today each “Pay with card” can create a new session and overwrite `stripe_checkout_session_id`. Mitigation options: reuse open session URL, block second session while one is unpaid, or stop overwriting until previous session is terminal. Reduces risk of “paid session A” vs “stored session B” mismatch.
2. **Accepted but no booking row** — Rare if slot checks align; if `ensureMaintenanceEnrollmentInitialBooking` fails after payment, define a runbook (manual booking / refund) and optionally a **retry ensure** job or admin action.
3. **Regenerate Supabase types** — `maintenance_enrollments` is often accessed via `any`; typed client reduces drift.
4. **Rate limiting / abuse** — Public routes are token-gated; optional WAF / rate limits for `anchor` / `checkout` / `confirm`.
5. **Cancel / revoke invite** — Product decision: soft-cancel enrollment, hide link, or rotate token.
6. **Parallel confirmation email** — Timestamp dedupe stops sequential retries; two simultaneous invocations could still double-send in theory; atomic “claim” row optional if observed.
7. **Observability** — Structured logs or metrics for `ensure` `skippedReason` after successful card payment.

---

## Changelog discipline

When changing flows, update **this README** and any **SQL** under `sql/` so deployers know what ran in prod vs what the code expects.
