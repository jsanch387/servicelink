# Contract: Mobile — `work_finished` (Done / Skip)

Owner marks physical work complete **before** payment close-out and final booking completion. This is **cycle 1** of the extended booking lifecycle — only the **Done / Skip** handoff step and its customer SMS.

**Not in this contract yet:** `job_completed` (Complete screen, fees, Tap to Pay, receipt + review). See [`mobile-booking-actions.md`](./mobile-booking-actions.md) for existing `on_the_way`, `job_started`, and `job_completed` behavior.

**Server implementation:** `POST /api/availability/bookings/[id]/actions` with `{ "action": "work_finished", "notify": boolean }`  
**Handler:** `src/features/availability/booking/server/handleWorkFinishedAction.ts`  
**Migration:** `src/features/availability/docs/migrations/003_bookings_work_handoff_status.sql`

---

## Product summary

While a job is **`in_progress`**, mobile shows **Done** and **Skip**:

| Mobile button | Request         | Customer SMS   | `work_handoff_status` after |
| ------------- | --------------- | -------------- | --------------------------- |
| **Done**      | `notify: true`  | Yes (SMS only) | `notified`                  |
| **Skip**      | `notify: false` | No             | `skipped`                   |

After either action, mobile shows **Mark complete** (wired in a later cycle).

**Golden rule (same as other job actions):** persist state first; SMS best-effort second. A failed SMS does **not** roll back `work_handoff_status`.

**Channel rule for this action:** **SMS only.** No email fallback on Done. Email is reserved for final `job_completed` (future cycle).

---

## Database — `bookings.work_handoff_status`

Run the SQL in [`003_bookings_work_handoff_status.sql`](../src/features/availability/docs/migrations/003_bookings_work_handoff_status.sql) in Supabase before calling this action in staging/production.

| Column                | Type            | Values                                |
| --------------------- | --------------- | ------------------------------------- |
| `work_handoff_status` | `text` nullable | `NULL` \| `'notified'` \| `'skipped'` |

| `job_status`  | `work_handoff_status`   | Next Up UI (mobile) |
| ------------- | ----------------------- | ------------------- |
| `in_progress` | `NULL`                  | **Done** + **Skip** |
| `in_progress` | `notified` or `skipped` | **Mark complete**   |
| `completed`   | (any)                   | None                |

- **`notified`** — owner tapped Done; server attempted `work_finished` SMS.
- **`skipped`** — owner tapped Skip; no SMS.
- New bookings start `NULL`. Re-opening / un-complete is not supported.

Include `work_handoff_status` in booking `SELECT`s (home spotlight, booking detail). A `select *` on `bookings` picks it up automatically after migration.

---

## Endpoint

|                     |                                                                |
| ------------------- | -------------------------------------------------------------- |
| **Method**          | `POST`                                                         |
| **Path**            | `/api/availability/bookings/{bookingId}/actions`               |
| **Example (local)** | `http://localhost:3000/api/availability/bookings/<id>/actions` |

Same route as [`mobile-booking-actions.md`](./mobile-booking-actions.md) — only the `action` value and body differ.

### Headers

| Header          | Value                                    |
| --------------- | ---------------------------------------- |
| `Authorization` | `Bearer <Supabase session access_token>` |
| `Content-Type`  | `application/json`                       |
| `Accept`        | `application/json`                       |
| `X-Request-ID`  | Optional UUID (mobile may send one)      |

### Request body

**Done (notify customer):**

```json
{
  "action": "work_finished",
  "notify": true
}
```

**Skip (no message):**

```json
{
  "action": "work_finished",
  "notify": false
}
```

| Field    | Required | Notes                                        |
| -------- | -------- | -------------------------------------------- |
| `action` | Yes      | Must be `"work_finished"`.                   |
| `notify` | Yes      | `true` = Done + SMS; `false` = Skip, no SMS. |

---

## Server behavior

### Preconditions

| Check                                                 | HTTP if fail                                   |
| ----------------------------------------------------- | ---------------------------------------------- |
| Booking exists and belongs to authenticated owner     | `404`                                          |
| `bookings.status = 'confirmed'`                       | `409`                                          |
| `job_status = 'in_progress'`                          | `409`                                          |
| `work_handoff_status IS NULL` (not already Done/Skip) | `200` idempotent (see below)                   |
| `notify: true` and no sendable phone on booking       | `409` — `"No phone on file for this booking."` |
| Missing / non-boolean `notify`                        | `400`                                          |

**Sendable phone:** non-empty `customer_phone` that normalizes to E.164 (same rules as other SMS). Mobile disables Done when there is no phone; the `409` is a server safeguard.

**Skip (`notify: false`)** succeeds even when there is no phone.

### State transition

- `job_status` stays **`in_progress`**
- `work_handoff_status` → **`notified`** when `notify: true`, **`skipped`** when `notify: false`
- Update is race-safe: `WHERE job_status = 'in_progress' AND work_handoff_status IS NULL`

### SMS (`notify: true` only)

|                         |                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------- |
| **`sms_messages.type`** | `work_finished`                                                                 |
| **Template**            | `{BusinessName} has finished your service. Come take a look when you're ready.` |
| **Dedupe key**          | `{bookingId}:work_finished`                                                     |
| **Rate limit**          | Owner SMS rate limit applies when `notify: true`                                |
| **Skip rate limit**     | No rate limit when `notify: false` (no SMS sent)                                |

Appends `Reply STOP to opt out.` like other transactional SMS.

---

## Success responses

**HTTP `200 OK`**

**Done — SMS sent:**

```json
{
  "success": true,
  "action": "work_finished",
  "jobStatus": "in_progress",
  "workHandoffStatus": "notified",
  "sms": { "sent": true, "messageId": "<uuid>", "reason": null }
}
```

**Done — SMS failed (state still advanced):**

```json
{
  "success": true,
  "action": "work_finished",
  "jobStatus": "in_progress",
  "workHandoffStatus": "notified",
  "sms": { "sent": false, "messageId": null, "reason": "error" }
}
```

**Skip:**

```json
{
  "success": true,
  "action": "work_finished",
  "jobStatus": "in_progress",
  "workHandoffStatus": "skipped",
  "sms": { "sent": false, "messageId": null, "reason": null }
}
```

**Idempotent — already Done or Skip:**

```json
{
  "success": true,
  "action": "work_finished",
  "jobStatus": "in_progress",
  "workHandoffStatus": "notified",
  "sms": { "sent": false, "messageId": null, "reason": "duplicate" }
}
```

`sms.reason` when `sent: false` ∈ `no_phone | invalid_number | duplicate | not_configured | error | null`  
(`null` = Skip path or SMS not attempted)

---

## Error responses

```json
{ "success": false, "error": "<English message>" }
```

| HTTP  | When                                                                          |
| ----- | ----------------------------------------------------------------------------- |
| `400` | Unknown action, or `notify` missing / not boolean                             |
| `401` | Not authenticated                                                             |
| `404` | Booking not found or wrong business                                           |
| `409` | Not `in_progress`, not `confirmed`, no phone on Done, or concurrent race lost |
| `429` | Rate limited (`Retry-After` header) — Done only                               |
| `500` | Server error                                                                  |

Failed SMS alone is **never** a non-2xx response when state was updated.

---

## Mobile integration checklist

- [ ] Apply DB migration (`work_handoff_status` column)
- [ ] Read `work_handoff_status` on home spotlight + booking detail queries
- [ ] Map `in_progress` + `NULL` → show **Done** / **Skip**
- [ ] Map `in_progress` + `notified|skipped` → show **Mark complete** (UI only until `job_completed` cycle)
- [ ] POST `{ "action": "work_finished", "notify": true }` from **Done**
- [ ] POST `{ "action": "work_finished", "notify": false }` from **Skip**
- [ ] On `200`: patch cache with `jobStatus` + `workHandoffStatus`; toast from `sms` when `notify: true`
- [ ] On `409` (no phone): safeguard — disable Done in UI for legacy rows without phone
- [ ] On `200` + `sms.reason === "duplicate"`: refetch; no error toast

---

## curl examples (staging)

**Done:**

```bash
curl -sS -X POST "$ORIGIN/api/availability/bookings/$BOOKING_ID/actions" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"work_finished","notify":true}'
```

**Skip:**

```bash
curl -sS -X POST "$ORIGIN/api/availability/bookings/$BOOKING_ID/actions" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"work_finished","notify":false}'
```

Use a booking with `status: confirmed`, `job_status: in_progress`, `work_handoff_status: null`.

---

## Related docs

| Doc                                                                                                           | Purpose                                          |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| [`mobile-booking-actions.md`](./mobile-booking-actions.md)                                                    | `on_the_way`, `job_started`, `job_completed`     |
| [`MOBILE_SMS_AND_BOOKING_ACTIONS.md`](../../src/features/availability/docs/MOBILE_SMS_AND_BOOKING_ACTIONS.md) | SMS logging, shared response shapes (if present) |

---

_Cycle 1 — server ships before mobile wires production UI against this contract._
