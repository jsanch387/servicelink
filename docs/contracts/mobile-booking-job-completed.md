# Contract: Mobile — `job_completed` (Complete sheet / Phase 1)

> **SMS outbound paused (2026-07):** Completion still persists fees, payment, invoice, and marks the booking complete. Customer receipt is sent via **email** when `customer.email` is present (`email.sent: true`). `sms.reason` is `"not_configured"` while paused. See [`../sms-outbound-paused.md`](../sms-outbound-paused.md).

Owner closes out a field job from the **Complete** full-screen sheet: add fees, collect balance, tap **Complete**. This is **cycle 2** of the extended booking lifecycle — payment close-out, invoice, and customer notification.

**Prior step (required):** [`mobile-booking-work-finished.md`](./mobile-booking-work-finished.md) — owner must tap **Done** or **Skip** first (`work_handoff_status` = `notified` | `skipped`).

**Related:** [`mobile-booking-actions.md`](./mobile-booking-actions.md) (shared actions endpoint), [`mobile-booking-work-finished.md`](./mobile-booking-work-finished.md) (Done/Skip).

**Server handler:** `src/features/availability/booking/server/handleJobCompletedAction.ts`  
**Migration:** [`docs/sql/booking_complete_phase1_migration.sql`](../sql/booking_complete_phase1_migration.sql)

---

## Product summary

After **Done/Skip**, mobile shows **Mark complete** → Complete sheet:

| Step | Mobile UI                                   | Server                                                                               |
| ---- | ------------------------------------------- | ------------------------------------------------------------------------------------ |
| 1    | Line items (service + add-ons)              | From booking row                                                                     |
| 2    | Add fee (label + dollars)                   | `sessionFees[]` in request                                                           |
| 3    | Collect balance (Tap to Pay / Mark as paid) | `sessionPayment` in request                                                          |
| 4    | Tap **Complete**                            | `POST …/actions` `job_completed`                                                     |
| 5    | Success                                     | Booking leaves Next Up; customer gets **email** with invoice link when email on file |

**Golden rule:** DB commit first; SMS/email best-effort second. Notification failure does **not** roll back completion.

**Do not call separately:** Supabase `UPDATE bookings SET status = completed`, `POST …/review-invite`, or per-fee endpoints.

---

## Endpoint

|                  |                                                  |
| ---------------- | ------------------------------------------------ |
| **Method**       | `POST`                                           |
| **Path**         | `/api/availability/bookings/{bookingId}/actions` |
| **Auth**         | `Authorization: Bearer <Supabase access_token>`  |
| **Content-Type** | `application/json`                               |
| **X-Request-ID** | Optional UUID (echoed in server logs)            |

### Request body

```json
{
  "action": "job_completed",
  "sessionFees": [{ "label": "Pet hair removal", "amountCents": 2500 }],
  "sessionPayment": {
    "method": "cash",
    "amountCents": 12000
  }
}
```

| Field                                  | Required             | Rules                                                                           |
| -------------------------------------- | -------------------- | ------------------------------------------------------------------------------- |
| `action`                               | Yes                  | `"job_completed"`                                                               |
| `sessionFees`                          | No                   | Default `[]`. Each: non-empty `label`, integer `amountCents` ≥ 0                |
| `sessionPayment`                       | No                   | Omit when customer already paid in full online                                  |
| `sessionPayment.method`                | When payment present | `cash` \| `payment_app` \| `other` \| `tap_to_pay`                              |
| `sessionPayment.amountCents`           | When payment present | Integer ≥ 0                                                                     |
| `sessionPayment.stripePaymentIntentId` | `tap_to_pay` only    | Required — see [`mobile-booking-tap-to-pay.md`](./mobile-booking-tap-to-pay.md) |

### Preconditions (server enforces)

| Check                          | Required                |
| ------------------------------ | ----------------------- |
| `bookings.status`              | `confirmed`             |
| `bookings.job_status`          | `in_progress`           |
| `bookings.work_handoff_status` | `notified` or `skipped` |
| Amount due                     | `0` (see math below)    |

### Amount-due math (must match Complete sheet)

```
subtotalCents =
  service_price_cents
  + sum(addon_details[].priceCents)
  + sum(sessionFees[].amountCents)

amountDueCents =
  subtotalCents
  - booking_payments.paid_online_amount_cents
  - sessionPayment.amountCents   // 0 if omitted
```

Server rejects with **400** `"Payment is still due on this booking."` when `amountDueCents > 0`.

Load `service_price_cents`, `addon_details`, and join/read `booking_payments` when rendering the Complete sheet.

---

## Success response (200)

```json
{
  "success": true,
  "action": "job_completed",
  "jobStatus": "completed",
  "bookingStatus": "completed",
  "workHandoffStatus": "notified",
  "invoicePublicToken": "a1b2c3…",
  "sms": { "sent": false, "messageId": null, "reason": "not_configured" },
  "email": { "sent": true, "messageId": "<resend-id>", "reason": null }
}
```

| Field                         | Notes                                                                                     |
| ----------------------------- | ----------------------------------------------------------------------------------------- |
| `jobStatus` / `bookingStatus` | Both `"completed"` — booking drops off Next Up                                            |
| `workHandoffStatus`           | Echoes `notified` or `skipped` from Done/Skip step                                        |
| `invoicePublicToken`          | Opaque token for customer invoice URL (optional for mobile UI today)                      |
| `sms` / `email`               | Always present. While SMS is paused: `sms.not_configured`; check `email.sent` for receipt |

Customer invoice URL (for debugging): `{EXPO_PUBLIC_WEB_APP_URL}/i/{invoicePublicToken}`

### Idempotent retry

Already completed → **200**, same statuses, `sms.reason: "duplicate"`, `invoicePublicToken` returned if invoice exists.

---

## Error responses

```json
{ "success": false, "error": "Human-readable message" }
```

| HTTP    | When                                                                                   |
| ------- | -------------------------------------------------------------------------------------- |
| **400** | Bad payload; payment still due; `tap_to_pay` without Stripe intent                     |
| **401** | Missing/invalid JWT                                                                    |
| **404** | Booking not found / not owned                                                          |
| **409** | Not `in_progress` or handoff not done → `"Mark work done before completing this job."` |
| **429** | Rate limited — honor `Retry-After`                                                     |
| **500** | Unexpected / persist failure                                                           |

---

## Mobile integration checklist

### 1. Lifecycle order

```
on_the_way → job_started → work_finished (Done/Skip) → job_completed (Complete)
```

Include `work_handoff_status` in booking SELECTs (Home Next Up, booking detail).

### 2. Complete sheet → HTTP

Build payload from sheet state:

```javascript
await postBookingAction(bookingId, 'job_completed', {
  sessionFees: fees.map(f => ({ label: f.label, amountCents: f.amountCents })),
  sessionPayment:
    amountDueCents > 0
      ? { method: selectedMethod, amountCents: collectedCents }
      : undefined,
});
```

Disable **Complete** until local `amountDueCents === 0`.

### 3. On 200

- Patch local caches: `job_status = completed`, `status = completed`
- Close Complete sheet; refresh Home / Next Up
- Toast from `sms` / `email` (reuse `bookingActionFeedback` patterns)
- Do **not** call legacy `completeBookingWithReviewInvite`

### 4. On error

- **409** handoff missing → surface “Mark work done first” (shouldn’t happen if UI gates correctly)
- **400** payment due → recheck math vs server
- Network failure → safe to retry (idempotent when already completed)

### 5. Feature flags (already on)

- `MARK_COMPLETE_USE_JOB_COMPLETED_ACTION = true`
- `MARK_COMPLETE_USE_COMPLETE_VISIT_SCREEN = true`

---

## Customer notification (what the owner’s customer receives)

- **SMS (primary):** `Thanks for choosing {Business}. I would appreciate it if you could leave us a review. {receipt link}` when review-eligible; otherwise `Thanks for choosing {Business}. View your receipt: {link}`
- **Email (fallback):** Same intent, only if SMS skipped/failed
- **Link:** `/i/{invoicePublicToken}` — HTML receipt + review button when eligible
- **Never both** SMS and email on the same completion

---

## Tap to Pay (Phase 2)

Stripe Tap to Pay on the Complete sheet is documented separately:

**[`mobile-booking-tap-to-pay.md`](./mobile-booking-tap-to-pay.md)** — connection token, PaymentIntent, SDK flow, PI verification on `job_completed`, and DB migration.

Phase 1 **Mark as paid** (`cash` / `payment_app` / `other`) remains available without Tap to Pay.

---

## curl smoke test

Precondition: `job_status = in_progress`, `work_handoff_status IN ('notified','skipped')`, amount-due math matches body.

```bash
curl -sS -X POST "$ORIGIN/api/availability/bookings/$BOOKING_ID/actions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-Request-ID: $(uuidgen)" \
  -d '{
    "action": "job_completed",
    "sessionFees": [{ "label": "Pet hair", "amountCents": 2500 }],
    "sessionPayment": { "method": "cash", "amountCents": 14500 }
  }'
```

Verify: booking completed, fee lines + invoice row in DB, `invoicePublicToken` in response, SMS contains `/i/` link, page loads.

---

## Server code map

| Concern                    | File                                                      |
| -------------------------- | --------------------------------------------------------- |
| Action branch              | `src/app/api/availability/bookings/[id]/actions/route.ts` |
| Validation + orchestration | `handleJobCompletedAction.ts`                             |
| Amount due                 | `computeBookingAmountDue.ts`                              |
| Persist + notify           | `persistJobCompletedTransaction.ts`                       |
| Public invoice page        | `src/app/i/[publicToken]/page.tsx`                        |
