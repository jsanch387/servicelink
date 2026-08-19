# Contract: Mobile — When we do not text the customer

SMS is a **best-effort side effect**. The owner action (on the way, start job, complete, Done, etc.) still happens. The API already returns why a text was skipped. **Do not block or roll back the UI because SMS did not send.**

The app never talks to Telnyx. The server owns consent, number checks, and the provider.

**Job actions (payload + toasts):** [`mobile-booking-actions.md`](./mobile-booking-actions.md) §4  
**Done / Skip:** [`mobile-booking-work-finished.md`](./mobile-booking-work-finished.md)

---

## Golden rule

On **HTTP 200** with `success: true`:

1. Apply the returned state (`jobStatus`, `bookingStatus`, `workHandoffStatus`, …).
2. If `sms.sent === false`, show a **soft toast** from `sms.reason`. Do not treat it as a failed tap, do not retry the action, do not keep a spinner, do not revert the status.
3. Only treat **4xx / 5xx** (or `success: false`) as a failed action.

```json
{
  "success": true,
  "action": "on_the_way",
  "jobStatus": "on_the_way",
  "sms": { "sent": false, "reason": "sms_opt_out" }
}
```

That means: job is on the way; customer was not texted because they opted out.

---

## `sms` block (already on the action APIs)

When `sent: true`:

```json
{ "sent": true, "messageId": "<sms_messages.id>" }
```

`job_completed` also always includes `reason: null` on a successful send, plus a sibling `email` block.

When `sent: false`:

```json
{ "sent": false, "reason": "invalid_number" }
```

`job_completed` / Done use `{ sent: false, messageId: null, reason }`. Same `reason` values.

`sms.reason` ∈

`no_phone | invalid_number | duplicate | not_configured | not_eligible | sms_opt_out | carrier_opt_out | error`

(`null` only on Done **Skip**, where SMS is not attempted.)

---

## Why we skip the text

Evaluated server-side, in this order. First match wins.

| `sms.reason`      | Condition                                                                | Suggested toast                                              |
| ----------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------ |
| `no_phone`        | No phone on the booking / customer                                       | “No phone number on file — customer wasn’t texted.”          |
| `not_configured`  | Outbound SMS off, or Telnyx not configured                               | Soft “couldn’t send text”                                    |
| `not_eligible`    | Business not allowed to send customer SMS (e.g. not Pro)                 | Soft “couldn’t send text”                                    |
| `sms_opt_out`     | `customers.sms_opt_in = false` (unchecked “text me” at book / subscribe) | “Customer opted out of texts — status still updated.”        |
| `invalid_number`  | Phone present but cannot normalize to E.164                              | “Phone number looks invalid — customer wasn’t texted.”       |
| `duplicate`       | Already sent this action for this booking (idempotent)                   | Silent — no extra toast                                      |
| `carrier_opt_out` | Telnyx **40300** — customer replied **STOP** to that number              | “Customer opted out of texts (STOP) — status still updated.” |
| `error`           | Provider / network failure                                               | Soft “couldn’t send text”                                    |

**Do not pre-check these in the app to disable On the way / Start / Complete.** Let the owner finish the job. Toast after.

---

## Two opt-outs (do not collapse them)

| Kind         | How it happens                                                                | Server flag                                                                     | What we persist                                                                                                     |
| ------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| App consent  | Customer unchecked SMS at public book, paid checkout, or membership subscribe | `customers.sms_opt_in = false`                                                  | Column stays false until they check the box on a later public flow. Owner manual booking does **not** overwrite it. |
| Carrier STOP | Customer texts STOP; Telnyx blocks the next send (`40300`)                    | Response `carrier_opt_out`; history row `sms_messages.status = skipped_opt_out` | We **do not** flip `sms_opt_in` to false. Next send will hit Telnyx again and skip the same way.                    |

Missing / null `sms_opt_in` → treated as **opted in** (legacy rows + checkbox default).

`customers.sms_opt_in` is readable with other customer fields via RLS if you want a badge. It is **not** required to gate actions — the send response already tells you.

There is no owner API today to toggle opt-in or to clear a carrier STOP.

---

## Endpoints that already return this

| Flow                                                                                          | HTTP 200 means              | SMS skip                                       |
| --------------------------------------------------------------------------------------------- | --------------------------- | ---------------------------------------------- |
| `POST /api/availability/bookings/{id}/actions` (`on_the_way`, `job_started`, `job_completed`) | Job / booking state changed | `sms.sent: false` + `reason`                   |
| Same path, `work_finished` (Done)                                                             | Work-finished state changed | Same `sms` block                               |
| Same path, Skip                                                                               | Skip recorded               | `sms.reason` may be `null` (no send attempted) |

Job-completed also returns `email: { sent, messageId, reason }`. Email skip does not fail completion either.

---

## Send schedule link (different: notify is the action)

[`mobile-subscriptions-send-schedule-link.md`](./mobile-subscriptions-send-schedule-link.md) — `POST /api/memberships/subscribers/{id}` `{ "action": "send_schedule_link" }`.

That endpoint **exists to notify**. It does not return `sms.reason`.

| Result                       | App                                                                                                                                                   |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **200** `emailed` / `smsed`  | Link was delivered on at least one channel. `smsed: false` is OK (no phone, opt-out, or SMS failed while email succeeded). Toast from those booleans. |
| **500** both channels failed | Show `error`. This is a failed send, not a skipped side effect.                                                                                       |

---

## History (`sms_messages`)

Owner can `SELECT` rows for their business. Status includes `skipped_opt_out` for carrier STOP. Consent skips (`sms_opt_out`) often have **no row** — we bail before insert. Do not require a history row to explain a toast; use the action response.
