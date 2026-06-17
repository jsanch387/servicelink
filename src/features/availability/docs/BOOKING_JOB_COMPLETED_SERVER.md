# `job_completed` — server behavior

Canonical server-side spec for the mobile `job_completed` action. The wire
contract lives in [`docs/contracts/mobile-booking-actions.md`](../../../../docs/contracts/mobile-booking-actions.md);
this file documents what the server actually does so the two never drift.

> Implemented by `POST /api/availability/bookings/{id}/actions` with
> `{ "action": "job_completed" }`. The web "Complete" button
> (`PATCH /api/availability/bookings/{id}` with `status: "completed"`) runs the
> **same** completion via the shared helper, so both paths behave identically.

## Server must do (in order)

1. **Auth** — verify the Supabase JWT; resolve the owner's business and confirm
   the booking belongs to it (RLS + explicit `business_id` check). Mismatch → `404`.
2. **Validate** — booking `status = confirmed` and `job_status = in_progress`
   (the action also accepts `not_started`/`on_the_way` as a server-side superset
   so the web button works; mobile only offers it from `in_progress`).
   If the booking is **already completed**, short-circuit to an idempotent `200`
   (see state machine).
3. **Persist completion** — update the DB:
   - `bookings.job_status = 'completed'`
   - `bookings.status = 'completed'` ← **required.** The mobile home query only
     loads `status = confirmed`; without this the job sticks on "Next Up".
4. **Notify customer — one channel only:**
   - Try **SMS first** if a valid phone exists: thank-you + review link only
     (no receipt, no payment link).
   - **Email fallback** only if SMS cannot send and a valid email exists:
     same thank-you + review link.
   - Never send both SMS and email on the same completion.
5. **Return** JSON with `success: true`, updated `jobStatus`, and **both** `sms`
   and `email` outcome blocks.
6. **Always persist completion even if notifications fail.** A notification
   failure must not roll back the booking (best-effort sends).

## State machine

```
in_progress  --(job_completed)-->  completed
```

| Rule                  | Detail                                                                      |
| --------------------- | --------------------------------------------------------------------------- |
| Required `status`     | `confirmed`                                                                 |
| Required `job_status` | `in_progress` (mobile); server also accepts `not_started`/`on_the_way`      |
| On success            | `job_status = completed`, `status = completed`                              |
| Idempotent            | Already `completed` → `200` with current state + `sms.reason = "duplicate"` |
| `409`                 | Invalid transition for non-completing actions (e.g. wrong business)         |

## Notification content (this phase)

- **SMS (primary):** thank the customer + short review link. No receipt/invoice/payment link.
- **Email (fallback only when SMS did not send):** same intent — thank-you + review link.
- Suggested copy: `Thanks for choosing {businessName}! We hope you loved your service. Leave a review: {reviewUrl}` (we append `Reply STOP to opt out.`).
- If the customer **already reviewed** (or isn't review-eligible), no review link
  is generated — the server sends a plain "completed, thank you" SMS courtesy
  instead (still one channel, still best-effort).

## Success response shape

Always include both `sms` and `email` objects. When `sent: true`, `reason` is
`null`; when `sent: false`, `messageId` is `null` and `reason` is set.

```json
{
  "success": true,
  "action": "job_completed",
  "jobStatus": "completed",
  "bookingStatus": "completed",
  "sms": { "sent": true, "messageId": "SMxxxx", "reason": null },
  "email": { "sent": false, "messageId": null, "reason": null }
}
```

### Outcomes (all implemented)

| Scenario                            | `sms`                               | `email`                       |
| ----------------------------------- | ----------------------------------- | ----------------------------- |
| SMS sent (happy path)               | `{ true, messageId, null }`         | `{ false, null, null }`       |
| No phone → email fallback           | `{ false, null, "no_phone" }`       | `{ true, messageId, null }`   |
| Phone invalid → email fallback      | `{ false, null, "invalid_number" }` | `{ true, messageId, null }`   |
| SMS provider error → email fallback | `{ false, null, "error" }`          | `{ true, messageId, null }`   |
| No contact at all                   | `{ false, null, "no_phone" }`       | `{ false, null, "no_email" }` |
| SMS skipped, email failed           | `{ false, null, "no_phone" }`       | `{ false, null, "error" }`    |
| Already completed (idempotent)      | `{ false, null, "duplicate" }`      | `{ false, null, null }`       |

`sms.reason` ∈ `no_phone | invalid_number | duplicate | not_configured | error`.
`email.reason` ∈ `no_email | duplicate | not_configured | error` (or `null` when not attempted).

## Error responses (same as other actions)

```json
{ "success": false, "error": "Human-readable message" }
```

| HTTP  | When                                        |
| ----- | ------------------------------------------- |
| `400` | Bad/missing `action`                        |
| `401` | Invalid/missing JWT                         |
| `404` | Booking not found / not owned               |
| `409` | Invalid transition (non-completing actions) |
| `429` | Rate limited — includes `Retry-After`       |
| `500` | Unexpected error                            |

## Out of scope (not implemented yet)

Receipt SMS/email, payment links, invoice line items, tap to pay / mark as paid.

## Code map

| Concern                                  | File                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------- |
| Action endpoint + idempotency + response | `src/app/api/availability/bookings/[id]/actions/route.ts`              |
| Web "Complete" button (same helper)      | `src/app/api/availability/bookings/[id]/route.ts`                      |
| Completion + single notification         | `src/features/availability/services/completeBookingWithSideEffects.ts` |
| Review link delivery (SMS-first/email)   | `src/features/reviews/server/createReviewInviteIfEligible.ts`          |
| SMS send + log + dedupe                  | `src/features/sms/services/sendAndRecordSms.ts`                        |
| Action registry / state machine          | `src/features/availability/booking/server/bookingActionCatalog.ts`     |

## curl smoke test

```bash
curl -sS -X POST "$API_BASE/api/availability/bookings/$BOOKING_ID/actions" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"job_completed"}'
```

Use a booking with `job_status: in_progress`, `status: confirmed`.
