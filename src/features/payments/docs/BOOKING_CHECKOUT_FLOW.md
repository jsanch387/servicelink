# Availability booking checkout flow (v1)

End-to-end reference for **public customers** paying for an **availability (V2) booking** through **Stripe Checkout** on the business’s **Stripe Connect** account. Use this doc for onboarding engineers and AI context.

Related docs:

- `DATABASE.md` — `payment_accounts`, `payment_settings`
- `BOOKING_CHECKOUT_SESSIONS_TABLE.md` — `booking_checkout_sessions` columns and intent
- `BOOKING_PAYMENTS_TABLE.md` — `booking_payments` columns and intent
- `SUPABASE_SCHEMA_CONTEXT.md` — how tables fit together
- `src/features/availability/services/bookingService.ts` — `createBooking` (server)
- `src/features/availability/docs/BOOKINGS_TABLE.md` — `bookings` row shape

---

## Product intent

1. Customer completes date/time, details, and review on `/[slug]/book` (with `serviceId` and optional add-ons from `/book/details`).
2. If the business requires **card payment online** (full or deposit), they click pay → **Stripe Checkout** (hosted) on the **connected account**.
3. **No `bookings` row exists until payment succeeds** (webhook path). That avoids “ghost” appointments for abandoned checkouts.
4. After success, Stripe redirects back to the app; the customer sees a **payment confirmation** screen and receives **emails** (owner + customer), same template family as other availability booking emails.
5. Non-card paths (payments off, pay in person, or confirm without checkout) still use **`POST /api/public/bookings`** and do not create `booking_checkout_sessions`.

---

## Preconditions (gates)

| Gate | Where enforced | Failure behavior |
|------|----------------|------------------|
| Business accepts availability bookings | Book page / `business_availability` | User does not reach paid checkout |
| `payment_settings.payments_enabled` | Client + `POST /api/public/booking-checkout` | Payment step hidden or API 400 |
| Connect account ready (`payment_accounts`, `charges_enabled`, Stripe account id) | `POST /api/public/booking-checkout` | API returns error asking owner to finish Stripe setup |
| Valid slot + payload (dates, customer, totals) | Client validation + API body parse | 400 from API |

Environment (typical):

- `NEXT_PUBLIC_SUPABASE_URL`, service role for admin writes in API routes
- `STRIPE_SECRET_KEY` (platform) — Checkout created with `{ stripeAccount: connectedAccountId }`
- `STRIPE_WEBHOOK_SECRET` — verifies `POST /api/stripe/webhook`
- `NEXT_PUBLIC_SITE_URL` (or request-derived base URL) — return URLs for Checkout

---

## High-level sequence

```text
Customer (AvailabilityBookingPage)
  → save resume draft to localStorage (optional)
  → POST /api/public/booking-checkout  (JSON: bookingPayload + amountCents + resumeQuery)
       → insert booking_checkout_sessions (status created, booking_payload, expected_amount_cents)
       → stripe.checkout.sessions.create (metadata.kind=booking_checkout, bookingCheckoutSessionId)
       → update row with stripe_checkout_session_id
       → return { url }
  → window.location = Stripe Checkout URL

Stripe (hosted)
  → customer pays

Stripe → GET success_url  (/{slug}/book?checkout=success&session_id={CHECKOUT_SESSION_ID}&…)
  → Server passes stripeCheckoutSessionId into page props (avoids calendar flash)
  → Client: loading “Confirming your payment…” then GET /api/public/booking-checkout-summary
       → reads booking_payments joined to bookings by last_checkout_session_id + businessSlug

Stripe → POST /api/stripe/webhook  (checkout.session.completed)
  → idempotency: insert stripe_webhook_events (duplicate → 200 exit)
  → if metadata.kind === booking_checkout:
       → load booking_checkout_sessions by id or stripe_checkout_session_id
       → validate amount_total === expected_amount_cents
       → createBooking(...) + insert booking_payments + update session completed
       → notify owner + send customer confirmation email (with payment summary)
```

**Important:** The **booking row is created in the webhook**, not when Checkout starts. The UI after return relies on **`booking_payments`** being written so the summary API can respond (race: if the browser returns before the webhook runs, the summary request may 404 briefly; client may fall back to calendar after URL cleanup).

---

## Client implementation

| Piece | Location | Role |
|-------|----------|------|
| Payment step, amounts, CTA | `src/features/availability/booking/components/AvailabilityBookingPage.tsx` | Computes `amountDueNowCents`, calls checkout API, handles cancel/success query params |
| Resume draft | `src/features/availability/booking/utils/bookingCheckoutResumeStorage.ts` | Persists step/customer/date/time across redirect so cancel can restore |
| Return URLs | `src/features/availability/booking/utils/bookingCheckoutReturnUrl.ts` | Builds `/[slug]/book?checkout=success|cancel&…`; appends `session_id={CHECKOUT_SESSION_ID}` **without** `URLSearchParams` so Stripe’s placeholder is not percent-encoded |
| Success loading | Same `AvailabilityBookingPage` | If `checkout=success` and session id present but summary not loaded yet → spinner (avoids flashing calendar) |
| Success UI | `src/features/availability/booking/components/BookingPaymentSuccess.tsx` | Glass card + payment breakdown from summary API |
| API route constants | `src/constants/routes.ts` — `API_ROUTES.PUBLIC_BOOKING_CHECKOUT`, `PUBLIC_BOOKING_CHECKOUT_SUMMARY` | Single source for paths |

Server book page passes **`stripeCheckoutSessionId`** when `?checkout=success&session_id=…` is present (`src/app/[business-slug]/book/page.tsx` → `BookFlowSwitch` → `AvailabilityBookingPage`) so the first paint can show the loading state without waiting only on `useSearchParams`.

---

## API routes

### `POST /api/public/booking-checkout`

**File:** `src/app/api/public/booking-checkout/route.ts`

- **Auth:** Public; uses **Supabase admin** to read business, `payment_accounts`, `payment_settings`, insert/update `booking_checkout_sessions`.
- **Body:** Includes a **booking draft** aligned with `CreateBookingRequest` fields plus `totalPriceCents`, `requiredOnlineAmountCents`, `paymentMethodSelected`, optional deposit snapshot.
- **Validates:** Business slug, Connect account, amount vs server recomputed “required online” cents, min/max cents, currency.
- **Writes:** `booking_checkout_sessions` row then Stripe session; stores `metadata.kind = booking_checkout`, `metadata.bookingCheckoutSessionId`, `metadata.businessId`, `metadata.businessSlug`.
- **Returns:** `{ success: true, url }` for Stripe hosted URL.

Debug logs: `[booking-checkout:api]` when `NODE_ENV=development` or `NEXT_PUBLIC_DEBUG_BOOKING_CHECKOUT=true`.

### `GET /api/public/booking-checkout-summary`

**File:** `src/app/api/public/booking-checkout-summary/route.ts`

- **Query:** `session_id`, `businessSlug`
- **Reads:** `booking_payments` with `last_checkout_session_id = session_id` and inner join `bookings` filtered by `business_slug`
- **Returns:** Payment status, currency, paid/remaining/total cents, booking snippet (service, schedule, add-ons, vehicle fields) for the confirmation UI

### `POST /api/stripe/webhook`

**File:** `src/app/api/stripe/webhook/route.ts`

- Verifies signature with `STRIPE_WEBHOOK_SECRET`.
- On `checkout.session.completed`, inserts **`stripe_webhook_events`** first (unique on `event_id` → duplicate Stripe retries exit early).
- **Branch A — Booking checkout:** `session.metadata.kind === 'booking_checkout'`
  - Loads `booking_checkout_sessions`, parses `booking_payload`, compares `amount_total` to `expected_amount_cents` (mismatch → mark session failed, 200).
  - **`createBooking`** with stored customer/service/add-ons/duration/slot.
  - Inserts **`booking_payments`** (`provider: stripe`, statuses `deposit_paid` or `paid_full`, amounts, `last_checkout_session_id`, deposit metadata).
  - Updates **`booking_checkout_sessions`** to `completed`, links `booking_id`.
  - **Owner notification** + **customer confirmation email** (availability email template + `paymentSummary` / `stripeCardPayment`).
- **Branch B — Subscriptions / other:** existing `metadata.userId` subscription checkout flow (booking branch returns after handling).

Debug logs: `[booking-checkout:webhook]` under same debug flags as above.

### `POST /api/public/bookings` (non-Stripe path)

**File:** `src/app/api/public/bookings/route.ts`

- Creates booking immediately when no Checkout is used.
- Loads `payment_settings` and attaches a **`paymentSummary`** to emails for “no card charge” / pay in person / payments disabled messaging (no `stripeCardPayment`).

---

## Database writes (booking checkout path)

Order matters conceptually:

1. **`booking_checkout_sessions`** — `status: created`, `booking_payload` JSON snapshot, `expected_amount_cents`, `payment_kind`, `currency`, etc.
2. **Stripe** — `checkout.sessions.create`; then row update with `stripe_checkout_session_id`.
3. **On `checkout.session.completed` only:**
   - **`bookings`** — one row via `createBooking` (includes `addon_details`, customer upsert → `customer_id`).
   - **`booking_payments`** — one row per booking (`paid_online_amount_cents`, `remaining_amount_cents`, `payment_status`, `last_checkout_session_id`, …).
   - **`booking_checkout_sessions`** — `status: completed`, `booking_id`, `completed_at`, `actual_amount_cents`, Stripe ids.
4. **`stripe_webhook_events`** — one row per processed event id (idempotency).

Tables are documented in `BOOKING_CHECKOUT_SESSIONS_TABLE.md` and `BOOKING_PAYMENTS_TABLE.md`; keep them aligned with migrations.

---

## Emails

- **Template builder:** `src/features/email/availability-booking-notification/availabilityBookingNotificationTemplate.ts`
- **Send paths:** `sendAvailabilityBookingCustomerConfirmationEmail`, owner path via `notifyOwnerForAvailabilityBookingCreated` (same payload shape).
- **Stripe-paid bookings:** `paymentSummary` includes line rows + `stripeCardPayment: true` so the template shows a **customer vs owner** Stripe receipt disclaimer (no “pay your provider” wording on the owner copy).
- **Price details card** + **Payment card** layout avoids duplicate “estimated bill” confusion; see template source for current structure.

---

## Stripe specifics

- **Connect:** `stripe.checkout.sessions.create(..., { stripeAccount: connectedAccountId })`.
- **Mode:** `payment` (one-time), not subscription.
- **Success URL:** Must contain literal `{CHECKOUT_SESSION_ID}` for Stripe substitution (handled in `bookingCheckoutReturnUrl.ts`).
- **Metadata:** Used to route webhooks and tie sessions to DB rows without trusting client-only data.

---

## Failure and edge behavior (v1)

| Situation | Behavior |
|-----------|----------|
| Customer abandons Checkout | No booking row; `booking_checkout_sessions` may remain `created` until cleanup job (future) or manual review |
| Amount mismatch (webhook vs expected) | Session marked failed; no booking |
| Webhook duplicate | `stripe_webhook_events` unique violation → no double booking |
| Summary API before webhook | 404 until row exists; client may end on calendar after URL strip (retry UX is a future improvement) |
| `GET` summary wrong slug | 404 |

---

## Automated tests (Vitest)

Focused tests live under `src/features/**/testing/` (see `vitest.config.ts`):

| Area | File |
|------|------|
| Stripe return URL (`{CHECKOUT_SESSION_ID}` not encoded) | `src/features/availability/booking/testing/bookingCheckoutReturnUrl.test.ts` |
| Confirmation email HTML (price vs payment blocks, Stripe footnotes customer vs owner) | `src/features/email/testing/availabilityBookingNotificationTemplate.test.ts` |
| Post-checkout UI (`BookingPaymentSuccess`) | `src/features/availability/booking/testing/bookingPaymentSuccess.test.tsx` |
| Calendar step navigation (existing) | `src/features/availability/booking/testing/availabilityBookingFlow.test.tsx` |

API routes (`booking-checkout`, webhook) are not integration-tested here; rely on manual/staging verification until a Stripe mock harness is added.

---

## Maintenance checklist

When changing checkout behavior, update:

1. This file (`BOOKING_CHECKOUT_FLOW.md`)
2. `BOOKING_CHECKOUT_SESSIONS_TABLE.md` / `BOOKING_PAYMENTS_TABLE.md` if columns or semantics change
3. `SUPABASE_SCHEMA_CONTEXT.md` relationship notes if ownership or FKs change
4. `README.md` in this folder (index table)

---

## File index (quick jump)

| Area | Path |
|------|------|
| Checkout API | `src/app/api/public/booking-checkout/route.ts` |
| Summary API | `src/app/api/public/booking-checkout-summary/route.ts` |
| Webhook | `src/app/api/stripe/webhook/route.ts` |
| Public booking (no checkout) | `src/app/api/public/bookings/route.ts` |
| Booking create service | `src/features/availability/services/bookingService.ts` |
| Owner notify | `src/features/availability/services/notifyOwnerForAvailabilityBookingCreated.ts` |
| Book page (props + flow switch) | `src/app/[business-slug]/book/page.tsx`, `BookFlowSwitch.tsx` |
| Return URL helper | `src/features/availability/booking/utils/bookingCheckoutReturnUrl.ts` |
