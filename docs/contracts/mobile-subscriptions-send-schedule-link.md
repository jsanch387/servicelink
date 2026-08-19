# Contract: Mobile — Send schedule link (needs visit)

Owner taps **Send booking / schedule link** on a subscriber who **needs a visit**. Mobile calls the server; the server builds the signed public visit URL, emails and/or texts the customer, and stamps throttle metadata. The app must **not** invent the link or send email/SMS itself.

**Web:** Subscriber detail → Send schedule link → same endpoint.  
**Server:** `sendOwnerMembershipScheduleLink` in `src/features/subscriptions/server/sendOwnerMembershipScheduleLink.ts`  
**Visit status:** [`mobile-subscriptions-period-visit.md`](./mobile-subscriptions-period-visit.md)  
**After customer books:** [`mobile-subscriptions-owner-book-visit.md`](./mobile-subscriptions-owner-book-visit.md) (or public `/{slug}/membership/visit`)

> This is **not** appointment reschedule (`PATCH` with `scheduledDate` / `startTime`). It is the **period-visit schedule link** for `visitStatus === "needs_visit"`.

---

## Endpoint

|             |                                                                        |
| ----------- | ---------------------------------------------------------------------- |
| **Method**  | `POST`                                                                 |
| **Path**    | `/api/memberships/subscribers/{subscriberId}`                          |
| **Example** | `https://<host>/api/memberships/subscribers/<customer_memberships.id>` |

`{subscriberId}` = `customer_memberships.id` (same id as subscriber detail / `membershipId` on Book visit).

---

## Authentication

| Header          | Value                            |
| --------------- | -------------------------------- |
| `Authorization` | `Bearer <Supabase access_token>` |
| `Content-Type`  | `application/json`               |

Owner must own the membership’s business. Cookie session also works (web). Memberships feature gate still applies (`assertMembershipsSubscriberAccess`).

---

## Request body

```json
{ "action": "send_schedule_link" }
```

| Field    | Type   | Required | Notes                          |
| -------- | ------ | -------- | ------------------------------ |
| `action` | string | Yes      | Exactly `"send_schedule_link"` |

No other fields. The server owns URL, templates, and throttle stamps.

---

## When the button should show

Only when `visitStatus === "needs_visit"` (see period-visit contract).

Do **not** call when:

| `visitStatus` | Server response if called                                |
| ------------- | -------------------------------------------------------- |
| `scheduled`   | **409** — visit already scheduled                        |
| `completed`   | **409** — period visit already complete                  |
| `none`        | **409** — membership not active / canceling / ineligible |

Also require email and/or phone on the subscriber (server returns **400** if neither).

---

## What the server does

1. Auth + business + memberships gate.
2. Load membership; require `visitStatus === needs_visit`.
3. Throttle checks (below).
4. Build signed URL: `/{businessSlug}/membership/visit?token=…` (same HMAC manage/visit token as web).
5. **Email** (if email on file) — schedule-link variant of the visit reminder template.
6. **SMS** (if phone on file **and** customer SMS opt-in) — schedule link body; logged to `sms_messages`.
7. Stamp metadata: `schedule_link_sent_at`, `schedule_link_sent_for_period_start`, `schedule_link_send_count`.
8. Return which channels succeeded + the URL (for optional “copy link” UI).

If both email and SMS fail to send → **500** (metadata not treated as success).

---

## Throttles (surface `error` to the owner)

| Layer                            | Limit                   | Status                                                                     |
| -------------------------------- | ----------------------- | -------------------------------------------------------------------------- |
| Per subscriber cooldown          | 1 send / **10 minutes** | **429** — “Already sent. Try again in a few minutes.” + `Retry-After`      |
| Per subscriber per Stripe period | **3** sends             | **429** — period cap message + `Retry-After`                               |
| Per owner (account)              | Hourly API rate limit   | **429** — “Too many schedule links sent. Try again later.” + `Retry-After` |

Respect `Retry-After` (seconds) when present.

---

## Success response

**200** (also includes memberships `requestId` / logging headers as other memberships routes)

```json
{
  "success": true,
  "emailed": true,
  "smsed": false,
  "scheduleUrl": "https://<host>/<slug>/membership/visit?token=..."
}
```

| Field         | Meaning                                                                                                                                                                                        |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `emailed`     | Customer email accepted by the mailer                                                                                                                                                          |
| `smsed`       | Customer SMS sent (false if no phone, opted out, or send failed while email succeeded). Skip rules: [`mobile-sms-skip.md`](./mobile-sms-skip.md) — this endpoint does not return `sms.reason`. |
| `scheduleUrl` | Absolute public visit URL — optional copy-to-clipboard; customer already received it when a channel succeeded                                                                                  |

Toast suggestion (match web):

- Both: `Schedule link sent via email + text`
- Email only: `Schedule link sent via email`
- SMS only: `Schedule link sent via text`

---

## Error responses

| Status      | When                                            | Body                                                       |
| ----------- | ----------------------------------------------- | ---------------------------------------------------------- |
| **400**     | Unknown action / no email or phone              | `{ "success": false, "error": "…" }`                       |
| **401**     | Missing/invalid auth                            | `{ "success": false, "error": "Authentication required" }` |
| **403/404** | Memberships gate / not found (see gate payload) | `{ "success": false, "error": "…", "gate"?: "…" }`         |
| **409**     | Not `needs_visit`                               | `{ "success": false, "error": "…" }`                       |
| **429**     | Cooldown / period cap / owner hourly            | `{ "success": false, "error": "…" }` + `Retry-After`       |
| **500**     | Send failed / slug missing                      | `{ "success": false, "error": "…" }`                       |

---

## Mobile UI rules

1. Show **Send schedule link** (or equivalent) only for **Needs visit**.
2. On tap: call this endpoint; disable button while in flight.
3. On **200**: toast using `emailed` / `smsed`; optionally offer copy `scheduleUrl`.
4. On **429**: show `error`; keep button disabled until `Retry-After` if you want.
5. On **409**: refresh subscriber detail — visit status likely changed.
6. Do **not** open the customer visit page in the owner app as a substitute for send (owner should use **Book visit** for self-booking).

---

## Suggested client helper

```ts
async function sendMembershipScheduleLink(args: {
  accessToken: string;
  subscriberId: string;
  apiOrigin: string;
}): Promise<
  | { ok: true; emailed: boolean; smsed: boolean; scheduleUrl: string }
  | { ok: false; error: string; status: number; retryAfterSec?: number }
> {
  const res = await fetch(
    `${args.apiOrigin}/api/memberships/subscribers/${args.subscriberId}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${args.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'send_schedule_link' }),
    }
  );
  const retryAfter = res.headers.get('Retry-After');
  const json = (await res.json().catch(() => null)) as {
    success?: boolean;
    error?: string;
    emailed?: boolean;
    smsed?: boolean;
    scheduleUrl?: string;
  } | null;

  if (!res.ok || !json?.success || !json.scheduleUrl) {
    return {
      ok: false,
      error: json?.error ?? 'Could not send schedule link.',
      status: res.status,
      retryAfterSec: retryAfter ? Number(retryAfter) : undefined,
    };
  }
  return {
    ok: true,
    emailed: Boolean(json.emailed),
    smsed: Boolean(json.smsed),
    scheduleUrl: json.scheduleUrl,
  };
}
```

---

## Related

| Doc                                                                                      | Topic                               |
| ---------------------------------------------------------------------------------------- | ----------------------------------- |
| [`mobile-subscriptions-period-visit.md`](./mobile-subscriptions-period-visit.md)         | When Needs visit                    |
| [`mobile-subscriptions-owner-book-visit.md`](./mobile-subscriptions-owner-book-visit.md) | Owner books instead of sending link |
| [`mobile-booking-cancel.md`](./mobile-booking-cancel.md)                                 | Cancel → Needs visit again          |
| Memberships `FLOWS.md`                                                                   | Web Send schedule link + throttles  |
