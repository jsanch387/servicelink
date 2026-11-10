# Contract: Mobile — Deny appointment request

Owner denies a public appointment **request** from the native app. The **server** sets `bookings.status` to `cancelled`, frees the slot, and tells the customer the time was not confirmed. Mobile must **not** `UPDATE bookings` in Supabase, and must **not** send that email or text itself.

**Web already does this** via `PATCH /api/availability/bookings/[id]` → `denyRequestedBooking`.  
**Implementation:** `src/app/api/availability/bookings/[id]/route.ts`, `denyRequestedBooking`, `notifyCustomerAppointmentRequestDenied`.

> **Auth:** `getAuthenticatedUser` — mobile **Bearer** or web cookie (same as approve, cancel, and `POST …/actions`).

The body is `{ "status": "cancelled" }`, the same JSON as canceling a confirmed appointment. The server decides which message to send from the row’s current status. Call this only while `status` is `requested`. A confirmed appointment that receives this body is a normal cancel ([`mobile-booking-cancel.md`](./mobile-booking-cancel.md)), and the customer gets the “was canceled” email instead.

---

## Endpoint

|             |                                                   |
| ----------- | ------------------------------------------------- |
| **Method**  | `PATCH`                                           |
| **Path**    | `/api/availability/bookings/{bookingId}`          |
| **Example** | `https://<host>/api/availability/bookings/<uuid>` |

`{bookingId}` = `bookings.id` from the request push (`data.reference_id`) or the booking detail screen.

Requires `bookings.write`. The shop owner has it. A teammate without that permission gets **403**.

---

## Authentication

| Header          | Value                            |
| --------------- | -------------------------------- |
| `Authorization` | `Bearer <Supabase access_token>` |
| `Content-Type`  | `application/json`               |

The server resolves the shop from the token. Do **not** send `businessId`. A booking that belongs to another shop is **404**.

---

## Request body

```json
{ "status": "cancelled" }
```

| Field    | Type   | Required | Notes                         |
| -------- | ------ | -------- | ----------------------------- |
| `status` | string | Yes      | Must be exactly `"cancelled"` |

Do **not** send `scheduledDate` or `startTime` in the same request.

---

## When to call

Show a confirm step first. Web copy:

- Title: `Deny request?`
- Body: `The customer will be told this time was not confirmed, and the slot will open back up.`
- Buttons: `Keep` (dismiss) and `Deny request` (send this call)

Call only when `status` is `requested` and `scheduled_date` is today or later.

The server’s “today” is the calendar date in `America/Chicago`, not the phone’s timezone. A request dated before that Chicago day cannot be denied.

---

## What the server does (in order)

1. Auth + require `bookings.write`. Scope the write to that shop.
2. If the row is still `requested` and `scheduled_date` is on or after the Chicago calendar day, set `bookings.status` to `cancelled`.
3. **Best-effort customer notice.** This is not the “your appointment was canceled” email. A missing contact is skipped. A failed send does **not** roll back the deny.
   - **Email** when `customer_email` is present. Subject: `Your appointment request was not confirmed`. Body: the request with `{Business}` was not confirmed, and that time is no longer held.
   - **SMS** when `customer_phone` is present and the customer has not opted out. Body: `Your appointment request with {Business} for {Mon, Jun 15} at {2:30 PM} was not confirmed. That time is no longer held.` Logged on `sms_messages` as `booking_request_denied`, deduped per booking.
4. Return the updated booking display payload.

The slot opens because `cancelled` does not block time. Nothing is charged or refunded. The owner is **not** notified again.

Denying a booking that is **already** `cancelled` returns **200** and does **not** send another email or text.

---

## Success response

**200**

```json
{
  "success": true,
  "data": {
    "id": "<bookingId>",
    "status": "cancelled",
    "date": "2026-12-20",
    "time": "9 AM",
    "startTimeHHmm": "09:00",
    "customerName": "Jane Doe",
    "serviceName": "Full detail"
  }
}
```

`data` is the display shape from `mapBookingRowToDisplay`. Treat `data.status === "cancelled"` as source of truth.

After **200**, hide Approve and Deny. The visit leaves the home upcoming list on refetch, because that list loads `status = confirmed`. It belongs with cancelled appointments.

---

## Error responses

| Status  | When                                                      | Body                                                        |
| ------- | --------------------------------------------------------- | ----------------------------------------------------------- |
| **400** | Missing body, or `status` sent together with a reschedule | `{ "success": false, "error": "…" }`                        |
| **401** | Missing or invalid token                                  | `{ "success": false, "error": "Authentication required" }`  |
| **403** | Signed in, without `bookings.write`                       | `{ "success": false, "error": "Forbidden" }`                |
| **404** | No shop, or this booking is not in the caller’s shop      | `{ "success": false, "error": "Booking not found" }`        |
| **409** | The request’s calendar day has passed                     | `{ "success": false, "error": "This request expired." }`    |
| **500** | Unexpected failure                                        | `{ "success": false, "error": "Failed to update booking" }` |

A past-day **409** marks that row `expired` and sends the customer the one-time expiry note. Do not call Deny again for that booking. Leave Approve and Deny off.

If this call is sent for a **confirmed** appointment, the server does not deny it. It cancels that appointment and sends the cancel email. Keep Deny off once `status` is `confirmed`.

---

## Mobile UI rules

1. Show Deny only while `status` is `requested` and the appointment day has not passed.
2. Confirm, then call this endpoint. Do not write `bookings.status` from the app.
3. On **200**: close the request actions. Do not send email or SMS from the app.
4. On **409** `This request expired.`: remove Approve and Deny. Show that the request expired.
5. On any other **4xx/5xx**: leave the booking as a request and show `error`.

---

## Suggested client helper

```ts
async function denyAppointmentRequest(args: {
  accessToken: string;
  bookingId: string;
  apiOrigin: string;
}): Promise<
  | { ok: true; booking: { id: string; status: string } }
  | { ok: false; status: number; error: string }
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
    return {
      ok: false,
      status: res.status,
      error: json?.error ?? 'Could not deny this request.',
    };
  }
  return { ok: true, booking: json.data };
}
```

---

## Do not use this endpoint for

| Goal                           | Use instead                                                                                              |
| ------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Approve a request              | [`mobile-booking-request-approve.md`](./mobile-booking-request-approve.md) — `{ "status": "confirmed" }` |
| Cancel a confirmed appointment | [`mobile-booking-cancel.md`](./mobile-booking-cancel.md) — same body, different current status           |
| Reschedule                     | [`mobile-booking-reschedule.md`](./mobile-booking-reschedule.md)                                         |
| Mark the job complete          | `POST …/actions` `{ "action": "job_completed" }`                                                         |

---

## Related

| Doc                                                                        | Topic                                   |
| -------------------------------------------------------------------------- | --------------------------------------- |
| [`mobile-booking-request-approve.md`](./mobile-booking-request-approve.md) | Approve the same request                |
| [`mobile-booking-cancel.md`](./mobile-booking-cancel.md)                   | Cancel a confirmed visit                |
| [`mobile-push-notifications.md`](./mobile-push-notifications.md)           | Tap payload: `reference_type` `booking` |
