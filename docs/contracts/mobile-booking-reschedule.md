# Contract: Mobile — Reschedule appointment

Owner moves a **confirmed** availability booking to a new date and time from the native app. The **server** owns the slot check, the row update, and the customer email + SMS. Mobile must **not** `UPDATE bookings` in Supabase directly, and must **not** send the reschedule text or email itself.

**Web already does this** via `PATCH /api/availability/bookings/[id]` → `rescheduleBookingForOwner`.  
**Implementation:** `src/app/api/availability/bookings/[id]/route.ts`, `rescheduleBookingForOwner` in `bookingService.ts`, `notifyCustomerAvailabilityBookingRescheduled`.

> **Auth:** `getAuthenticatedUser` — mobile **Bearer** or web cookie (same as cancel and `POST …/actions`).

> This is **not** the membership “send schedule link” (`POST /api/memberships/subscribers/{id}` with `send_schedule_link`). That asks a subscriber to pick a visit. This moves an appointment that already exists.

---

## Endpoint

|             |                                                   |
| ----------- | ------------------------------------------------- |
| **Method**  | `PATCH`                                           |
| **Path**    | `/api/availability/bookings/{bookingId}`          |
| **Example** | `https://<host>/api/availability/bookings/<uuid>` |

`{bookingId}` = `bookings.id` (same id returned from create / used for actions and cancel).

Requires `bookings.write`. The shop owner has it. A teammate does not — they get **403**.

---

## Authentication

| Header          | Value                            |
| --------------- | -------------------------------- |
| `Authorization` | `Bearer <Supabase access_token>` |
| `Content-Type`  | `application/json`               |

The server resolves the shop from the token. Do **not** send `businessId`. Wrong shop / missing booking → **404**.

---

## Request body

Send **only** the new slot. Do **not** include `status`.

```json
{
  "scheduledDate": "2026-08-20",
  "startTime": "14:30"
}
```

| Field           | Type   | Required | Notes                                                                |
| --------------- | ------ | -------- | -------------------------------------------------------------------- |
| `scheduledDate` | string | Yes      | `YYYY-MM-DD`                                                         |
| `startTime`     | string | Yes      | 24-hour `HH:mm` (or `H:mm`, e.g. `9:00`). Server stores zero-padded. |

Duration, jobs, customer, assignee, and payment stay as they are. Do not send them.

---

## What the server does (in order)

1. Auth + require `bookings.write`.
2. Load the booking. It must be `confirmed` (completed or cancelled → **409**).
3. Check the new slot:
   - Weekly hours: the existing duration must fit that day’s open window. A closed day fails.
   - Time off: overlap with a time-off block fails.
   - Lead time (`minimum_notice`) is **not** applied. Owners may move a job to today or earlier.
   - Another job on the same slot is **not** a hard block. Owners may stack. Show a heads-up in the app if you want; still send the request.
4. Save `scheduled_date` and `start_time`. Sale / promo snapshot may refresh for the new date (`data.discount` on the response).
5. **Best-effort customer notice**, only when the date or time actually changed:
   - **Email** when `customer_email` is present. Subject: `Your appointment with {Business} was rescheduled`. Body includes the service, the new time, and the previous time.
   - **SMS** when `customer_phone` is present and the usual SMS gates pass (opt-in, STOP, Telnyx). Body: `Your appointment with {Business} was rescheduled to {Mon, Jun 15} at {2:30 PM}.` Logged on `sms_messages` as `booking_rescheduled`.
6. Return the updated booking display payload.

A failed email or text does **not** roll back the new time. Sending the same date and time again returns **200** and sends nothing. If two requests race, only the one that changes the row sends. The other finds the booking already on that slot, returns **200**, and does not email or text again.

---

## Success response

**200**

```json
{
  "success": true,
  "data": {
    "id": "<bookingId>",
    "status": "confirmed",
    "date": "2026-08-20",
    "startTimeHHmm": "14:30",
    "time": "2:30 PM",
    "customerName": "Jane Doe",
    "serviceName": "Exterior Wash"
  }
}
```

`data` is the dashboard display shape (`mapBookingRowToDisplay`), not the request field names.

| Read this            | Meaning                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------ |
| `data.date`          | New date, `YYYY-MM-DD`. This is **not** `scheduledDate`.                                               |
| `data.time`          | New time for display (`2:30 PM`).                                                                      |
| `data.startTimeHHmm` | Machine time on the `:00` / `:30` grid. Use `data.time` if you sent a minute that is not `00` or `30`. |
| `data.status`        | Stays `confirmed`.                                                                                     |

Replace the local row from `data`. There is **no** `sms` or `email` block. Do not toast “couldn’t text” from this response.

---

## Error responses

```json
{ "success": false, "error": "<English message>" }
```

| Status  | When                                                             | App handling                             |
| ------- | ---------------------------------------------------------------- | ---------------------------------------- |
| **400** | Missing date or time, bad format, or `status` sent with the slot | Client bug. Show `error`.                |
| **401** | Missing/invalid token                                            | Prompt re-auth.                          |
| **403** | Signed-in user lacks `bookings.write` (teammate)                 | Hide reschedule. `error` is `Forbidden`. |
| **404** | No shop, or booking not on this shop                             | “Appointment not found.”                 |
| **409** | Not `confirmed`, outside working hours, or overlaps time off     | Keep the old slot. Show `error`.         |
| **500** | Unexpected failure                                               | Allow retry.                             |

**409** `error` strings the app can show as-is:

| Situation                         | `error`                                                                    |
| --------------------------------- | -------------------------------------------------------------------------- |
| Not confirmed                     | `Only confirmed appointments can be rescheduled.`                          |
| No weekly hours saved             | `Set your weekly availability before rescheduling appointments.`           |
| Outside that day’s hours          | `That time is outside your working hours for that day. Pick another slot.` |
| Time off                          | `That time overlaps time you marked unavailable. Choose a different slot.` |
| Lost a race (no longer confirmed) | `That booking is no longer confirmed or was removed.`                      |

---

## Mobile UI rules

1. Only offer reschedule on `status === "confirmed"` when the user has `bookings.write`.
2. Confirm before send.
3. On **200**: show the new `data.date` / `data.time`. Do not send email or SMS from the app.
4. On **4xx/5xx**: keep the previous slot on screen and show `error`.
5. Debounce the button. One tap = one request.

---

## Suggested client helper

```ts
async function rescheduleAppointment(args: {
  accessToken: string;
  bookingId: string;
  apiOrigin: string;
  scheduledDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
}): Promise<
  | {
      ok: true;
      booking: { id: string; status: string; date: string; time: string };
    }
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
      body: JSON.stringify({
        scheduledDate: args.scheduledDate,
        startTime: args.startTime,
      }),
    }
  );
  const json = (await res.json().catch(() => null)) as {
    success?: boolean;
    error?: string;
    data?: { id: string; status: string; date: string; time: string };
  } | null;

  if (!res.ok || !json?.success || !json.data) {
    return {
      ok: false,
      status: res.status,
      error: json?.error ?? 'Could not reschedule this appointment.',
    };
  }
  return { ok: true, booking: json.data };
}
```

---

## Do not use this for

| Goal                             | Use instead                                                                                                       |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Cancel                           | Same `PATCH` with `{ "status": "cancelled" }` — [`mobile-booking-cancel.md`](./mobile-booking-cancel.md)          |
| Mark job complete                | `POST …/actions` `{ "action": "job_completed" }`                                                                  |
| Ask a subscriber to pick a visit | Send schedule link — [`mobile-subscriptions-send-schedule-link.md`](./mobile-subscriptions-send-schedule-link.md) |
| Create a new appointment         | `POST /api/public/bookings`                                                                                       |

---

## Related

| Doc                                                        | Topic                               |
| ---------------------------------------------------------- | ----------------------------------- |
| [`mobile-booking-cancel.md`](./mobile-booking-cancel.md)   | Cancel (same PATCH, different body) |
| [`mobile-booking-actions.md`](./mobile-booking-actions.md) | On the way / start / complete       |
| [`mobile-sms-skip.md`](./mobile-sms-skip.md)               | Why a customer text can be skipped  |
