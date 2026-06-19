# `job_completed` — server behavior (Phase 1)

**Canonical mobile contract:** [`docs/contracts/mobile-booking-job-completed.md`](../../../../docs/contracts/mobile-booking-job-completed.md)

**DB migration (required before prod):** [`docs/sql/booking_complete_phase1_migration.sql`](../../../../docs/sql/booking_complete_phase1_migration.sql)

## Scope

Phase 1 covers the mobile **Complete** sheet flow:

1. Owner adds session fees and collects balance (cash / payment app / other — not Tap to Pay yet).
2. Mobile sends `POST /api/availability/bookings/{id}/actions` with `action: "job_completed"`.
3. Server persists fees, payment summary, invoice snapshot, and marks booking completed.
4. Customer receives **one** notification (SMS first, email fallback) with link to `/i/{invoicePublicToken}`.

## Entry points

| Path | Handler | Invoice? |
| ---- | ------- | -------- |
| Mobile `POST …/actions` `job_completed` | `handleJobCompletedAction.ts` → `persistJobCompletedTransaction.ts` | **Yes** |
| Web `PATCH …/bookings/{id}` `status: completed` | `completeBookingWithSideEffects.ts` | **No** (legacy thank-you / review SMS only) |

Mobile and web completion are **not** identical today. Web dashboard Complete does not create `booking_invoices` rows or send invoice links. Mobile must use the actions endpoint per the contract.

## Preconditions (mobile)

| Check | Value |
| ----- | ----- |
| `bookings.status` | `confirmed` |
| `bookings.job_status` | `in_progress` |
| `bookings.work_handoff_status` | `notified` or `skipped` |
| Amount due | `0` (see `computeBookingAmountDue.ts`) |

## Persist order (`persistJobCompletedTransaction.ts`)

1. Replace `booking_session_fee_lines`
2. Upsert `booking_payments` session columns + `paid_full`
3. Insert `booking_invoices` (immutable snapshot + `public_token`)
4. Mark booking `job_status` + `status` = `completed`
5. Best-effort maintenance side effect
6. SMS-first customer notification with invoice URL

Invoice insert runs **before** booking completion so a failed invoice write does not leave a completed booking without a receipt.

## Public invoice page

| Route | Loader | UI |
| ----- | ------ | -- |
| `GET /i/{publicToken}` | `loadPublicBookingInvoiceByToken.ts` | `PublicInvoicePageShell.tsx` |

Token is opaque (64-char hex). Page is `noindex`. Snapshot JSON is the display source of truth.

## Review CTA

Review invite row is created internally via `ensureReviewInviteRecordIfEligible.ts` during persist. Review URL is embedded in the invoice snapshot — mobile must **not** call a separate review-invite POST.

## Tap to Pay (Phase 2)

**Contract:** [`docs/contracts/mobile-booking-tap-to-pay.md`](../../../../docs/contracts/mobile-booking-tap-to-pay.md)

- `POST …/tap-to-pay/connection-token` — Terminal SDK
- `POST …/tap-to-pay/intent` — PaymentIntent on Connect account
- `job_completed` with `tap_to_pay` — verify PI then existing persist path
- Migration: [`docs/sql/booking_tap_to_pay_phase2_migration.sql`](../../../../docs/sql/booking_tap_to_pay_phase2_migration.sql)

## Code map

| Concern | File |
| ------- | ---- |
| Action branch | `src/app/api/availability/bookings/[id]/actions/route.ts` |
| Validation | `handleJobCompletedAction.ts`, `parseJobCompletedBody.ts` |
| Amount due | `computeBookingAmountDue.ts` |
| Snapshot | `buildInvoiceSnapshot.ts` |
| Persist + notify | `persistJobCompletedTransaction.ts` |
| Public page | `src/app/i/[publicToken]/page.tsx` |
| Receipt UI | `public/components/PublicInvoicePageShell.tsx` |
