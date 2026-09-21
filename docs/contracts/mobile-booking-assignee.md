# Contract: Mobile — Booking assignee

Set or clear who is on a job. Same write + email path as web. Do **not** `UPDATE bookings` from the app.

**Implementation:** `PATCH /api/availability/bookings/:bookingId/assignee`  
**Write:** `updateBookingAssignee` (service role)  
**Email:** `notifyAssigneeForJobAssigned`

---

## Auth

`Authorization: Bearer <Supabase access_token>` (web also accepts cookies).

Actor must be the shop owner or an active member of that booking’s shop. Do not send `businessId`.

---

## Body

```json
{ "assignedUserId": "<auth.users.id>" }
```

Unassign: `{ "assignedUserId": null }`. If set, the id must be the owner or an **active** member. Pending invites are not allowed.

---

## Success (`200`)

```json
{ "success": true, "data": { "assignedUserId": "<id>" | null } }
```

---

## Errors

`{ "success": false, "error": "…" }`

| Status | When                                                   |
| ------ | ------------------------------------------------------ |
| `400`  | Missing body, or assignee is not owner / active member |
| `401`  | Missing or invalid Bearer                              |
| `403`  | Actor is not on this shop                              |
| `404`  | Booking missing or not on this shop                    |
| `409`  | Booking is `completed` or `cancelled`                  |

---

## Email

Server sends after a successful write, only when `assignedUserId` is set, it changed, and it is not the actor. Self-assign and unassign send nothing.
