# Contract: Mobile — Create or edit a subscription plan

Owner creates or edits a customer subscription plan from ServiceLink mobile. Same routes as the web dashboard. Stripe catalog sync stays on the server.

**Create:** `POST /api/memberships/plans` in `src/app/api/memberships/plans/route.ts`  
**Edit:** `PATCH /api/memberships/plans/{planId}` in `src/app/api/memberships/plans/[planId]/route.ts`  
**Validation:** `parseMembershipPlanWriteBody`

---

## Authentication

**Required.**

| Client | Header                                          |
| ------ | ----------------------------------------------- |
| Mobile | `Authorization: Bearer <Supabase access_token>` |
| Web    | Session cookies                                 |

The shop is the owned business. Optional `businessId` must match that shop or the request is rejected. Omit it.

---

## Schedules

Send `intervalUnit` and `intervalCount`. These are the only pairs the endpoint accepts. Every 3 months and every 6 months are included.

| Label          | `intervalUnit` | `intervalCount` |
| -------------- | -------------- | --------------- |
| Weekly         | `week`         | `1`             |
| Every 2 weeks  | `week`         | `2`             |
| Monthly        | `month`        | `1`             |
| Every 3 months | `month`        | `3`             |
| Every 6 months | `month`        | `6`             |

One visit per billing period. A 3-month option bills once every 3 months and covers one visit in that period. Same for 6 months. Do not send `year`, `quarter`, or any other count.

A plan can include more than one of these. The same pair cannot appear twice.

---

## Request body (JSON)

```json
{
  "name": "Exterior Wash",
  "description": "Keep the car looking fresh.",
  "visitDurationMinutes": 60,
  "cadenceOptions": [
    { "intervalUnit": "month", "intervalCount": 1, "priceCents": 8900 },
    { "intervalUnit": "month", "intervalCount": 3, "priceCents": 15000 },
    { "intervalUnit": "month", "intervalCount": 6, "priceCents": 24000 }
  ]
}
```

| Field                  | Type   | Required | Notes                                                                 |
| ---------------------- | ------ | -------- | --------------------------------------------------------------------- |
| `name`                 | string | Yes      | Trimmed. Empty is rejected.                                           |
| `description`          | string | No       | Customers see this on the booking link. Omit or send `""`.            |
| `visitDurationMinutes` | int    | No       | 30–630, multiple of 30. Omitted becomes 60.                           |
| `cadenceOptions`       | array  | Yes      | At least one. `priceCents` is a positive integer (cents, before tax). |

---

## Success

**`200`**

```json
{ "success": true, "plan": {} }
```

`plan.cadenceOptions` includes the saved rows. Each option’s `id` is the price id. `intervalCount` `3` or `6` with `intervalUnit` `"month"` is every 3 or 6 months. Checkout uses that price’s Stripe price, so a customer who picks it is billed on that cadence.

Edit sends the full `cadenceOptions` list. Options left out are removed. Removing a cadence that still has an active subscriber is rejected.

---

## Errors

| Status | When                                                                                                                                                                                            |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `400`  | Missing name, bad duration, empty cadences, unknown schedule, bad price, or duplicate pair. Body: `{ "success": false, "error": "..." }`. Unknown schedule: `"That schedule is not available."` |
| `401`  | Missing or invalid session.                                                                                                                                                                     |
| `403`  | Not allowed to manage billing, or subscriptions are not ready for this shop.                                                                                                                    |
| `404`  | Edit target plan is missing.                                                                                                                                                                    |
