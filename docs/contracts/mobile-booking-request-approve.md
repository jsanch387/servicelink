# Contract: Mobile — Approve appointment request

Owner approves a public appointment **request** from the native app. The **server** sets `bookings.status` to `confirmed` and sends the customer confirmation email and SMS. Mobile must **not** `UPDATE bookings` in Supabase, and must **not** send the confirmation email or text itself.

**Web already does this** via `PATCH /api/availability/bookings/[id]` → `approveRequestedBooking`.  
**Implementation:** `src/app/api/availability/bookings/[id]/route.ts`, `approveRequestedBooking`, `notifyCustomerAppointmentRequestApproved`.

> **Auth:** `getAuthenticatedUser` — mobile **Bearer** or web cookie (same as cancel, reschedule, and `POST …/actions`).

This is only **approve**. Deny is [`mobile-booking-request-deny.md`](./mobile-booking-request-deny.md). Do not send `status: "cancelled"` from the Approve button.

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
{ "status": "confirmed" }
```

| Field    | Type   | Required | Notes                         |
| -------- | ------ | -------- | ----------------------------- |
| `status` | string | Yes      | Must be exactly `"confirmed"` |

Do **not** send `scheduledDate` or `startTime` in the same request. Those fields reschedule a confirmed appointment.

---

## When to call

Call this only from Approve on a booking whose `status` is `requested` and whose `scheduled_date` is still today or later.

The server’s “today” is the calendar date in `America/Chicago`, not the phone’s timezone. A request dated before that Chicago day cannot be approved.

---

## What the server does (in order)

1. Auth + require `bookings.write`. Scope the write to that shop.
2. Update `bookings.status` from `requested` to `confirmed`, only when `scheduled_date` is on or after the Chicago calendar day.
3. **Best-effort customer notice.** A missing contact is skipped. A failed send does **not** roll back the approval.
   - **Email** when `customer_email` is present. Subject: `Your appointment with {Business}`. Heading: `Your appointment is confirmed`.
   - **SMS** when `customer_phone` is present and the customer has not opted out. Body: `Your appointment with {Business} was confirmed for {Mon, Jun 15} at {2:30 PM}.` Logged on `sms_messages` as `booking_request_approved`, deduped per booking.
4. Return the updated booking display payload.

The owner is **not** notified again. Nothing is charged. The slot stays held because `confirmed` still blocks that time.

Approving a booking that is **already** `confirmed` returns **200** and does **not** send another email or text.

---

## Success response

**200**

```json
{
  "success": true,
  "data": {
    "id": "<bookingId>",
    "status": "confirmed",
    "date": "2026-12-20",
    "time": "9 AM",
    "startTimeHHmm": "09:00",
    "customerName": "Jane Doe",
    "serviceName": "Full detail"
  }
}
```

`data` is the display shape from `mapBookingRowToDisplay`. Treat `data.status === "confirmed"` as source of truth. This response does not include a payment summary. Keep the payment already on screen, or refetch the booking if the screen needs it.

After **200**, show the normal confirmed appointment. Hide Approve and Deny. The home upcoming list includes it only after a refetch, because that list loads `status = confirmed`.

---

## Error responses

| Status  | When                                                      | Body                                                        |
| ------- | --------------------------------------------------------- | ----------------------------------------------------------- |
| **400** | Missing body, or `status` sent together with a reschedule | `{ "success": false, "error": "…" }`                        |
| **401** | Missing or invalid token                                  | `{ "success": false, "error": "Authentication required" }`  |
| **403** | Signed in, without `bookings.write`                       | `{ "success": false, "error": "Forbidden" }`                |
| **404** | No shop, or this booking is not in the caller’s shop      | `{ "success": false, "error": "Booking not found" }`        |
| **409** | Not a request, or the request’s calendar day has passed   | `{ "success": false, "error": "…" }`                        |
| **500** | Unexpected failure                                        | `{ "success": false, "error": "Failed to update booking" }` |

**409** `error` strings:

| `error`                           | Meaning                                                                                          |
| --------------------------------- | ------------------------------------------------------------------------------------------------ |
| `This request expired.`           | Status was `requested` on a past Chicago day, or status is already `expired`. Leave Approve off. |
| `Only a request can be approved.` | Status is `cancelled`, `completed`, or anything other than `requested` / already `confirmed`.    |

A past-day **409** also marks that row `expired` and sends the customer the one-time expiry note. Do not call Approve again for that booking.

---

## Mobile UI rules

1. Show Approve only while `status` is `requested` and the appointment day has not passed.
2. On tap, call this endpoint. Do not write `bookings.status` from the app.
3. On **200**: switch the open screen to a confirmed appointment. Do not send email or SMS from the app.
4. On **409** with `This request expired.`: remove Approve and Deny. Show that the request expired.
5. On any other **4xx/5xx**: leave the booking as a request and show `error`.

---

## Suggested client helper

```ts
async function approveAppointmentRequest(args: {
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
      body: JSON.stringify({ status: 'confirmed' }),
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
      error: json?.error ?? 'Could not approve this request.',
    };
  }
  return { ok: true, booking: json.data };
}
```

---

## Do not use this endpoint for

| Goal                           | Use instead                                                                                        |
| ------------------------------ | -------------------------------------------------------------------------------------------------- |
| Deny a request                 | [`mobile-booking-request-deny.md`](./mobile-booking-request-deny.md) — `{ "status": "cancelled" }` |
| Cancel a confirmed appointment | [`mobile-booking-cancel.md`](./mobile-booking-cancel.md) — `{ "status": "cancelled" }`             |
| Reschedule                     | [`mobile-booking-reschedule.md`](./mobile-booking-reschedule.md)                                   |
| Mark the job complete          | `POST …/actions` `{ "action": "job_completed" }`                                                   |

---

## Related

| Doc                                                                  | Topic                                   |
| -------------------------------------------------------------------- | --------------------------------------- |
| [`mobile-booking-request-deny.md`](./mobile-booking-request-deny.md) | Deny the same request                   |
| [`mobile-push-notifications.md`](./mobile-push-notifications.md)     | Tap payload: `reference_type` `booking` |
| [`mobile-booking-cancel.md`](./mobile-booking-cancel.md)             | Cancel a confirmed visit                |
| [`mobile-booking-actions.md`](./mobile-booking-actions.md)           | On the way / start / complete           |
