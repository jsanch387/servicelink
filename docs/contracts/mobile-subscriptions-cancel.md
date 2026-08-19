# Contract: Mobile — Cancel subscription

Owner cancels a **customer membership** from subscriber detail. Mobile calls the server; the server cancels in Stripe, updates `customer_memberships`, and emails the customer. The app must **not** call Stripe or `UPDATE customer_memberships` directly.

**Web:** Subscriber detail `⋯` → Cancel subscription → same endpoint.  
**Server:** `cancelOwnerCustomerMembership` in `src/features/subscriptions/server/cancelOwnerCustomerMembership.ts`  
**Display after cancel:** [`mobile-subscriptions-phase1-data.md`](./mobile-subscriptions-phase1-data.md) (status / `cancelAtPeriodEnd` / next bill)  
**Visit UI after cancel:** [`mobile-subscriptions-period-visit.md`](./mobile-subscriptions-period-visit.md) (`visitStatus` becomes `none` unless a leftover appointment is already on file)

> This is **not** canceling an appointment. Appointment cancel: [`mobile-booking-cancel.md`](./mobile-booking-cancel.md).

**Auth:** `getAuthenticatedUser` — mobile **Bearer** or web cookie (same as send schedule link).

---

## Endpoint

|             |                                                                        |
| ----------- | ---------------------------------------------------------------------- |
| **Method**  | `POST`                                                                 |
| **Path**    | `/api/memberships/subscribers/{subscriberId}`                          |
| **Example** | `https://<host>/api/memberships/subscribers/<customer_memberships.id>` |

`{subscriberId}` = `customer_memberships.id` (same id as subscriber detail).

---

## Authentication

| Header          | Value                            |
| --------------- | -------------------------------- |
| `Authorization` | `Bearer <Supabase access_token>` |
| `Content-Type`  | `application/json`               |

Owner must own the membership’s business. Memberships feature gate still applies (`assertMembershipsSubscriberAccess`).

---

## Request body

Two actions — pick one:

```json
{ "action": "cancel_at_period_end" }
```

```json
{ "action": "cancel_now" }
```

| Field    | Type   | Required | Notes                                      |
| -------- | ------ | -------- | ------------------------------------------ |
| `action` | string | Yes      | `"cancel_at_period_end"` or `"cancel_now"` |

| Action                 | Stripe                       | Access                        | Next bill                                               |
| ---------------------- | ---------------------------- | ----------------------------- | ------------------------------------------------------- |
| `cancel_at_period_end` | `cancel_at_period_end: true` | Keeps access until period end | UI **Next bill** is `—`; show **access until** `{date}` |
| `cancel_now`           | `subscriptions.cancel`       | Ends now                      | Status **Canceled**, no access-until banner             |

**Web default:** period-end is the primary button; **Cancel now** is the destructive option. Mirror that on mobile (confirm before send).

---

## When the button should show

Match web `canCancel`:

```
status !== "canceled"
AND NOT cancelAtPeriodEnd
AND NOT planRemoved
```

(`cancelAtPeriodEnd` here is the mapped “cancel is scheduled” flag from phase1-data — Stripe boolean **or** future `cancel_at`.)

Do **not** offer cancel when already canceled / already canceling / plan removed.

---

## What the server does

1. Auth + business + memberships gate.
2. Load membership for this owner; require Stripe account + subscription ids.
3. **Idempotent:** if already `canceled`, or `cancel_at_period_end` while already scheduled to cancel → sync from Stripe, return **200** with `alreadyCanceled: true` (not an error).
4. Otherwise cancel in Stripe (period-end update vs immediate cancel).
5. Upsert `customer_memberships` from the Stripe subscription.
6. Record a membership event (`cancel_requested` or `canceled`).
7. **Best-effort** customer “subscription canceled” email (period-end includes access-until date; immediate says ended now). Idempotent via `metadata.cancel_confirmation_sent_key`. Failures do **not** roll back Stripe cancel.
8. Return the fresh owner subscriber payload.

**Does not** auto-cancel leftover calendar appointments (known gap — owner/customer still cancel those separately).

**Does not** send a “book next visit” reminder.

---

## Success response

**200**

```json
{
  "success": true,
  "alreadyCanceled": false,
  "subscriber": {
    "id": "<customer_memberships.id>",
    "status": "active",
    "cancelAtPeriodEnd": true,
    "nextBillingAt": null,
    "visitStatus": "none"
  }
}
```

`subscriber` is the same owner-subscriber shape as GET subscriber detail / phase1-data mapping. Treat it as source of truth — replace local cache.

| Field                          | Meaning                                                                                                          |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `alreadyCanceled`              | `true` if this was already canceled / already scheduled (idempotent retry). Still **200**.                       |
| `subscriber.status`            | After **Cancel now**: `"canceled"`. After **period end**: often still `"active"` with `cancelAtPeriodEnd: true`. |
| `subscriber.cancelAtPeriodEnd` | `true` when cancel is scheduled (access until period end).                                                       |
| `subscriber.visitStatus`       | `"none"` unless a leftover scheduled/completed visit for this period is still on file.                           |

Toast suggestion (match web):

- New period-end: `Cancels at period end`
- New immediate: `Subscription canceled`
- `alreadyCanceled: true`: `Subscription already canceled — status updated`

---

## Error responses

| Status      | When                                    | Body                                                                             |
| ----------- | --------------------------------------- | -------------------------------------------------------------------------------- |
| **400**     | Unknown action / missing Stripe ids     | `{ "success": false, "error": "…" }`                                             |
| **401**     | Missing/invalid auth                    | `{ "success": false, "error": "Authentication required" }`                       |
| **403/404** | Memberships gate / subscriber not found | `{ "success": false, "error": "…", "gate"?: "…" }`                               |
| **502**     | Stripe cancel failed                    | `{ "success": false, "error": "Could not cancel this subscription in Stripe." }` |
| **500**     | Unexpected                              | `{ "success": false, "error": "…" }`                                             |

---

## Mobile UI rules

1. Confirm before send (period-end vs now). Prefer period-end as the default.
2. Disable the action while in flight.
3. On **200**: apply `subscriber` to detail + list; toast from `alreadyCanceled` + which action was sent.
4. Hide **Cancel subscription** after success (`canCancel` is false).
5. Hide **Needs visit** / Book visit / Send schedule link when `visitStatus === "none"`.
6. Upcoming appointment on the calendar **stays** until canceled separately ([`mobile-booking-cancel.md`](./mobile-booking-cancel.md)).
7. Do **not** send the customer cancel email from the app.

---

## Suggested client helper

```ts
type CancelMembershipAction = 'cancel_at_period_end' | 'cancel_now';

async function cancelMembership(args: {
  accessToken: string;
  subscriberId: string;
  apiOrigin: string;
  action: CancelMembershipAction;
}): Promise<
  | {
      ok: true;
      alreadyCanceled: boolean;
      subscriber: { id: string; status: string; cancelAtPeriodEnd?: boolean };
    }
  | { ok: false; error: string; status: number }
> {
  const res = await fetch(
    `${args.apiOrigin}/api/memberships/subscribers/${args.subscriberId}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${args.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: args.action }),
    }
  );
  const json = (await res.json().catch(() => null)) as {
    success?: boolean;
    error?: string;
    alreadyCanceled?: boolean;
    subscriber?: {
      id: string;
      status: string;
      cancelAtPeriodEnd?: boolean;
    };
  } | null;

  if (!res.ok || !json?.success || !json.subscriber) {
    return {
      ok: false,
      error: json?.error ?? 'Could not cancel subscription.',
      status: res.status,
    };
  }
  return {
    ok: true,
    alreadyCanceled: Boolean(json.alreadyCanceled),
    subscriber: json.subscriber,
  };
}
```

---

## Related

| Doc                                                                                          | Topic                                        |
| -------------------------------------------------------------------------------------------- | -------------------------------------------- |
| [`mobile-subscriptions-phase1-data.md`](./mobile-subscriptions-phase1-data.md)               | Status, cancel scheduled, next bill          |
| [`mobile-subscriptions-period-visit.md`](./mobile-subscriptions-period-visit.md)             | Visit section after cancel                   |
| [`mobile-booking-cancel.md`](./mobile-booking-cancel.md)                                     | Cancel leftover appointment                  |
| [`mobile-subscriptions-send-schedule-link.md`](./mobile-subscriptions-send-schedule-link.md) | Same subscriber POST route, different action |
| Memberships `FLOWS.md`                                                                       | Owner cancel + customer cancel email         |
