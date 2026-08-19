# Contract: Mobile — Cancel appointment

Owner cancels a **confirmed** availability booking from the native app. The **server** owns the status update, customer cancel email, and membership period-visit unlink. Mobile must **not** `UPDATE bookings` in Supabase directly.

**Web already does this** via `PATCH /api/availability/bookings/[id]` → `updateBookingStatus(..., 'cancelled')`.  
**Implementation:** `src/app/api/availability/bookings/[id]/route.ts`, `updateBookingStatus` in `bookingService.ts`, `notifyCustomerAvailabilityBookingCanceled`.

> **Auth:** `getAuthenticatedUser` — mobile **Bearer** or web cookie (same as `POST …/actions`).

---

## Endpoint

|             |                                                   |
| ----------- | ------------------------------------------------- |
| **Method**  | `PATCH`                                           |
| **Path**    | `/api/availability/bookings/{bookingId}`          |
| **Example** | `https://<host>/api/availability/bookings/<uuid>` |

`{bookingId}` = `bookings.id` (same id returned from create / used for actions).

---

## Authentication

| Header          | Value                            |
| --------------- | -------------------------------- |
| `Authorization` | `Bearer <Supabase access_token>` |
| `Content-Type`  | `application/json`               |

Owner must own the booking’s business (`business_profiles.profile_id = auth.uid()`). Wrong business / missing booking → **404**.

---

## Request body

```json
{ "status": "cancelled" }
```

| Field    | Type   | Required | Notes                                                               |
| -------- | ------ | -------- | ------------------------------------------------------------------- |
| `status` | string | Yes      | Must be exactly `"cancelled"` (British spelling — matches DB check) |

Do **not** send `scheduledDate` / `startTime` in the same request (those are reschedule-only).

---

## What the server does (in order)

1. Auth + resolve owner business.
2. Update `bookings.status` → `cancelled` (RLS / ownership scoped).
3. **Best-effort** if this booking is a membership period visit: clear `customer_memberships.period_visit_*` → subscriber goes back to **Needs visit** when eligible, and nudge the **owner** (in-app + push: “Subscription needs a visit” / “Schedule a visit for {Name}”).
4. **Best-effort** customer email: cancel confirmation when `customer_email` is present (`notifyCustomerAvailabilityBookingCanceled`). Failures do **not** roll back the cancel.
5. Return the updated booking display payload.

No customer SMS on cancel today (email only). Slot frees because status is no longer `confirmed`.

---

## Success response

**200**

```json
{
  "success": true,
  "data": {
    "id": "<bookingId>",
    "status": "cancelled",
    "scheduledDate": "2026-08-20",
    "startTime": "09:00",
    "customerName": "Jane Doe",
    "serviceName": "Exterior Wash"
  }
}
```

`data` is the same display shape web uses (`mapBookingRowToDisplay`). Treat `data.status === "cancelled"` as source of truth; update local cache / remove from “upcoming”.

There is **no** separate `email: { sent }` block today — email is fire-and-forget. If mobile needs an explicit outcome later, that can be added without changing the cancel semantics.

---

## Error responses

| Status  | When                                                             | Body                                                        |
| ------- | ---------------------------------------------------------------- | ----------------------------------------------------------- |
| **400** | Missing/invalid `status`, or status + reschedule fields together | `{ "success": false, "error": "…" }`                        |
| **401** | Missing/invalid auth                                             | `{ "success": false, "error": "Authentication required" }`  |
| **404** | No business / booking not found for this owner                   | `{ "success": false, "error": "…" }`                        |
| **500** | Unexpected failure                                               | `{ "success": false, "error": "Failed to update booking" }` |

**Idempotency:** Re-PATCHing an already-`cancelled` booking should still succeed as an update (same status). Prefer treating **200** as “canceled”; refetch if UI is unsure.

Do **not** use this endpoint for:

| Goal                                 | Use instead                                                                        |
| ------------------------------------ | ---------------------------------------------------------------------------------- |
| Mark job complete                    | `POST …/actions` `{ "action": "job_completed" }` (or web complete sheet)           |
| Reschedule                           | Same `PATCH` with `{ "scheduledDate", "startTime" }` only — see availability FLOWS |
| Hard-delete row                      | `DELETE /api/availability/bookings/{id}` (no cancel email; rare)                   |
| Cancel **membership** (stop billing) | Memberships subscriber cancel APIs — not this                                      |

---

## Mobile UI rules

1. Confirm before send (“Cancel this appointment?”).
2. On **200**: remove from upcoming / show canceled; toast success.
3. Do **not** send the cancel email from the app.
4. If this booking was a membership period visit, refetch subscriber detail — visit status should flip to **needs_visit** (when eligible).
5. On **4xx/5xx**: keep booking confirmed; show `error` string.

---

## Suggested client helper

```ts
async function cancelAppointment(args: {
  accessToken: string;
  bookingId: string;
  apiOrigin: string;
}): Promise<
  | { ok: true; booking: { id: string; status: string } }
  | { ok: false; error: string }
> {
  const res = await fetch(
    `${args.apiOrigin}/api/availability/bookings/${args.bookingId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${args.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'cancelled' }),
    }
  );
  const json = (await res.json().catch(() => null)) as {
    success?: boolean;
    error?: string;
    data?: { id: string; status: string };
  } | null;

  if (!res.ok || !json?.success || !json.data) {
    return { ok: false, error: json?.error ?? 'Could not cancel appointment.' };
  }
  return { ok: true, booking: json.data };
}
```

---

## Web checklist before mobile ships

- [x] `PATCH /api/availability/bookings/[id]` accepts **Bearer** via `getAuthenticatedUser` (parity with `/actions`)
- [ ] Cancel still sends customer email when email on file
- [ ] Membership period visit unlink still runs on cancel
- [ ] Smoke: cancel confirmed booking → status `cancelled` → customer gets email → slot free

---

## Related

| Doc                                                                                      | Topic                         |
| ---------------------------------------------------------------------------------------- | ----------------------------- |
| [`mobile-booking-actions.md`](./mobile-booking-actions.md)                               | On the way / start / complete |
| [`mobile-subscriptions-period-visit.md`](./mobile-subscriptions-period-visit.md)         | Visit status after unlink     |
| [`mobile-subscriptions-owner-book-visit.md`](./mobile-subscriptions-owner-book-visit.md) | Booking a covered visit       |
| Availability `FLOWS.md`                                                                  | Web PATCH / DELETE overview   |
