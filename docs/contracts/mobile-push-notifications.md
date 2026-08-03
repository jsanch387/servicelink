# Contract: Mobile — Expo push notifications & deep links

Use this when implementing **push notification delivery**, **tap handling**, and **in-app navigation** in the Expo app.

The web/API server sends pushes via the **Expo Push API**. Pushes are **not** triggered by Supabase database listeners on `notifications`. For transactional events (new booking, quote, review), the server inserts an in-app notification row **and** sends Expo push in the same server function. For product updates / feature announcements, ops sends a **broadcast** push via an internal API route.

**Server implementation (reference):**

| Piece                      | Path                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------ |
| Expo sender                | `src/features/push/server/sendExpoPushToUser.ts`                                     |
| Broadcast route            | `POST /api/internal/push/broadcast` → `src/app/api/internal/push/broadcast/route.ts` |
| Single-user internal route | `POST /api/internal/push/send` → `src/app/api/internal/push/send/route.ts`           |
| Token table (Supabase)     | `user_push_tokens`                                                                   |

---

## App URL scheme

The native app uses the custom scheme:

```
servicelinkmobile://
```

Examples already used in production web flows:

| Deep link                                              | Purpose                           |
| ------------------------------------------------------ | --------------------------------- |
| `servicelinkmobile://payments/connect?connect=return`  | Stripe Connect onboarding return  |
| `servicelinkmobile://payments/connect?connect=refresh` | Stripe Connect onboarding refresh |

**Mobile owns the full route map.** This contract defines the **`data` payload** the server sends; the app maps that payload to React Navigation (or equivalent) screens. Prefer reusing the same paths your `linking` config already exposes so push taps and universal links behave the same.

---

## Device token registration (mobile → Supabase)

On sign-in (and when the Expo push token changes), the app must upsert into **`user_push_tokens`**:

| Column            | Type                 | Notes                                                |
| ----------------- | -------------------- | ---------------------------------------------------- |
| `user_id`         | `uuid`               | Authenticated user id (`auth.uid()` / `profiles.id`) |
| `expo_push_token` | `string`             | `ExponentPushToken[...]` from `expo-notifications`   |
| `platform`        | `'ios' \| 'android'` | Device platform                                      |
| `updated_at`      | `timestamptz`        | Optional; set on upsert                              |

Without a row here, the server **cannot** deliver push to that device. Registration is **client-side** (not handled by this web repo).

---

## What the server sends (Expo message shape)

Every push from the server uses this shape when posted to Expo:

```json
{
  "to": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "title": "Short headline shown on the lock screen",
  "body": "Optional subtitle (may be omitted)",
  "data": {
    "reference_type": "booking",
    "reference_id": "550e8400-e29b-41d4-a716-446655440000",
    "referenceType": "booking",
    "referenceId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**Rules:**

- `title` is always present.
- `body` may be absent (server omits the key when empty).
- `data` values are **always strings** (Expo requirement).
- Both **snake_case** and **camelCase** keys are sent for `reference_type` / `reference_id` so older and newer app builds can read either. **Mobile must read both** (prefer snake_case, fall back to camelCase).

**Mobile must not** depend on `title` / `body` text to decide navigation — routing is driven only by `data.reference_type` and `data.reference_id`.

---

## Deep-link routing contract

When the user **taps** a notification (foreground, background, or cold start), the app must:

1. Parse `data.reference_type` and `data.reference_id` (snake_case or camelCase).
2. Resolve a destination via the **routing table** below.
3. Navigate after auth is ready (if the user is signed out, complete sign-in then navigate).
4. If the route is unknown, open the **notifications inbox** or **home** — never crash or show a blank screen.

Implement a single entry point, e.g. `resolvePushDestination({ referenceType, referenceId })`, used by:

- `Notifications.addNotificationResponseReceivedListener` (tap while app running / backgrounded)
- Cold-start handler (`getLastNotificationResponseAsync` on launch)
- Optional: in-app `notifications` list rows (same `reference_type` / `reference_id` as push `data`)

---

### Routing table (required mobile behavior)

#### A. Transactional — entity detail (already sent by server today)

These are sent automatically when business events occur. `reference_id` is always a **UUID** (or stable entity id) for that entity.

| `reference_type`  | `reference_id`       | Navigate to                                                         |
| ----------------- | -------------------- | ------------------------------------------------------------------- |
| `booking`         | Booking UUID         | Booking **detail** screen for that id                               |
| `booking_request` | Booking-request UUID | Legacy booking request detail (or map to booking detail if unified) |
| `quote`           | Quote UUID           | Quote **detail** screen for that id                                 |
| `review`          | Review UUID          | Review **detail** screen for that id                                |

**Server sources:** `notifyOwnerForAvailabilityBookingCreated`, `notifyOwnerForPublicQuoteRequest`, `notifyOwnerForReviewSubmitted`, `POST /api/booking-request/submit`, etc.

#### B. Broadcast — screen destinations (product updates)

Used when ops sends a **feature announcement** via `POST /api/internal/push/broadcast`. There is **no entity UUID** — `reference_id` is a **screen slug** the app understands.

| `reference_type` | `reference_id` (screen slug) | Navigate to                                |
| ---------------- | ---------------------------- | ------------------------------------------ |
| `screen`         | `home`                       | App home / dashboard tab                   |
| `screen`         | `bookings`                   | Bookings list                              |
| `screen`         | `quotes`                     | Quotes list                                |
| `screen`         | `customers`                  | Customers list                             |
| `screen`         | `reviews`                    | Reviews list                               |
| `screen`         | `payments`                   | Payments / payouts settings                |
| `screen`         | `payments_connect`           | Stripe Connect onboarding / connect status |
| `screen`         | `maintenance`                | Maintenance enrollments                    |
| `screen`         | `availability`               | Availability / calendar settings           |
| `screen`         | `services`                   | Services management                        |
| `screen`         | `profile`                    | Business profile edit                      |
| `screen`         | `qr_code`                    | Business QR code (view / share)            |
| `screen`         | `upgrade`                    | Pro / upgrade paywall                      |
| `screen`         | `settings`                   | Account / settings                         |

**Convention:** `reference_type: "screen"` + `reference_id: "<slug>"`.

Mobile should treat unknown slugs as **no-op navigation** (stay on current screen or open home) and log in dev.

#### C. Broadcast — entity deep links (optional but supported)

Ops can deep-link to a **specific record** in a broadcast (e.g. “Your booking was updated — tap to view”).

| `reference_type` | `reference_id` | Navigate to                         |
| ---------------- | -------------- | ----------------------------------- |
| `booking`        | Booking UUID   | Booking detail                      |
| `booking_edit`   | Booking UUID   | Booking **edit** screen for that id |
| `quote`          | Quote UUID     | Quote detail                        |
| `quote_edit`     | Quote UUID     | Quote **edit** screen for that id   |
| `customer`       | Customer UUID  | Customer detail                     |
| `review`         | Review UUID    | Review detail                       |

Use the `_edit` suffix types when the announcement should land on an **edit** flow, not read-only detail.

#### D. Legacy / alias

| `reference_type` | `reference_id`               | Notes                                                                                                 |
| ---------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------- |
| `announcement`   | Any screen slug from table B | **Alias for `screen`** — treat the same as `reference_type: "screen"`. Used in early broadcast tests. |

---

### Mapping to `servicelinkmobile://` (recommended)

Keep push routing and universal linking in sync. Example mapping (mobile team adjusts to match actual navigator paths):

| `reference_type` | `reference_id`     | Suggested deep link                        |
| ---------------- | ------------------ | ------------------------------------------ |
| `screen`         | `payments`         | `servicelinkmobile://payments`             |
| `screen`         | `payments_connect` | `servicelinkmobile://payments/connect`     |
| `screen`         | `bookings`         | `servicelinkmobile://bookings`             |
| `booking`        | `{uuid}`           | `servicelinkmobile://bookings/{uuid}`      |
| `booking_edit`   | `{uuid}`           | `servicelinkmobile://bookings/{uuid}/edit` |
| `quote`          | `{uuid}`           | `servicelinkmobile://quotes/{uuid}`        |
| `quote_edit`     | `{uuid}`           | `servicelinkmobile://quotes/{uuid}/edit`   |
| `review`         | `{uuid}`           | `servicelinkmobile://reviews/{uuid}`       |
| `customer`       | `{uuid}`           | `servicelinkmobile://customers/{uuid}`     |
| `screen`         | `maintenance`      | `servicelinkmobile://maintenance`          |

Implementation pattern:

```ts
function resolvePushDestination(referenceType: string, referenceId: string) {
  const type = referenceType.trim().toLowerCase();
  const id = referenceId.trim();

  if (type === 'announcement' || type === 'screen') {
    return screenSlugToRoute(id); // table B
  }
  if (type === 'booking') return { name: 'BookingDetail', params: { id } };
  if (type === 'booking_edit') return { name: 'BookingEdit', params: { id } };
  // ... etc.
  return { name: 'Home' };
}
```

---

## Push sources

### 1. Transactional (automatic)

Server sends to **one owner** when an event happens. Also inserts a row into **`notifications`** for the in-app bell.

| Event                    | `reference_type`  | `reference_id`     |
| ------------------------ | ----------------- | ------------------ |
| New availability booking | `booking`         | Booking id         |
| Legacy booking request   | `booking_request` | Booking request id |
| Public quote request     | `quote`           | Quote id           |
| Review submitted         | `review`          | Review id          |

### 2. Broadcast (manual — product updates)

Ops triggers via internal API. Sends to **all** devices in `user_push_tokens` (or one test user).

|                  |                                                      |
| ---------------- | ---------------------------------------------------- |
| **Method**       | `POST`                                               |
| **Path**         | `/api/internal/push/broadcast`                       |
| **Auth header**  | `x-internal-push-secret: <INTERNAL_PUSH_API_SECRET>` |
| **Content-Type** | `application/json`                                   |

**Request body:**

| Field                 | Type   | Required | Notes                                                                                     |
| --------------------- | ------ | -------- | ----------------------------------------------------------------------------------------- |
| `title`               | string | Yes      | Lock-screen title                                                                         |
| `body`                | string | No       | Lock-screen body                                                                          |
| `data.reference_type` | string | Yes      | Routing key — see tables above                                                            |
| `data.reference_id`   | string | Yes      | Entity UUID or screen slug                                                                |
| `testEmail`           | string | No       | If set, push goes **only** to that auth user’s devices (for QA). Omit for full broadcast. |

**Success (broadcast):**

```json
{ "ok": true, "tokenCount": 142, "messageCount": 142 }
```

**Success (test mode):**

```json
{
  "ok": true,
  "testMode": true,
  "testEmail": "owner@example.com",
  "userId": "...",
  "tokenCount": 1,
  "messageCount": 1
}
```

### 3. Single-user internal send

Same `data` shape as broadcast, but requires `userId` instead of `testEmail`. Used for server-to-server one-off sends.

`POST /api/internal/push/send` — see `src/app/api/internal/push/send/route.ts`.

---

## Example broadcast payloads (for ops / Postman)

**Payments feature update → payments screen:**

```json
{
  "title": "Payments just got easier",
  "body": "Tap to set up payouts in a few taps.",
  "data": {
    "reference_type": "screen",
    "reference_id": "payments"
  }
}
```

**Maintenance launch → maintenance screen:**

```json
{
  "title": "Maintenance plans are here",
  "body": "Offer recurring visits to your customers.",
  "data": {
    "reference_type": "screen",
    "reference_id": "maintenance"
  }
}
```

**QR codes launch → QR code screen:**

```json
{
  "title": "QR codes are here",
  "body": "You now have a QR code — tap to check it out or share it.",
  "data": {
    "reference_type": "screen",
    "reference_id": "qr_code"
  }
}
```

**Deep link to a specific booking edit:**

```json
{
  "title": "Appointment needs your attention",
  "body": "Tap to update this booking.",
  "data": {
    "reference_type": "booking_edit",
    "reference_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**Test only one user (no broadcast):**

```json
{
  "testEmail": "owner@example.com",
  "title": "Test push",
  "body": "Only this account should receive this.",
  "data": {
    "reference_type": "screen",
    "reference_id": "payments"
  }
}
```

**Example curl (local):**

```bash
curl -X POST http://localhost:3000/api/internal/push/broadcast \
  -H "Content-Type: application/json" \
  -H "x-internal-push-secret: $INTERNAL_PUSH_API_SECRET" \
  -d '{
    "testEmail": "owner@example.com",
    "title": "Test: payments update",
    "body": "Tap to open payments.",
    "data": {
      "reference_type": "screen",
      "reference_id": "payments"
    }
  }'
```

---

## Mobile implementation checklist

- [ ] Request notification permission and obtain Expo push token (`expo-notifications`).
- [ ] Upsert token into `user_push_tokens` on login and on token refresh.
- [ ] Implement `resolvePushDestination(referenceType, referenceId)` per routing tables **A–D**.
- [ ] Handle notification tap via `addNotificationResponseReceivedListener`.
- [ ] Handle cold start via `getLastNotificationResponseAsync()` after navigation is ready.
- [ ] Read both `reference_type` / `referenceType` and `reference_id` / `referenceId` from `data`.
- [ ] Do **not** parse navigation from `title` / `body` strings.
- [ ] Align screen slugs with React Navigation / `linking` config (`servicelinkmobile://...`).
- [ ] Add `screen` and `booking_edit` / `quote_edit` handlers before first broadcast.
- [ ] Treat `announcement` as alias for `screen` (backward compatible with test payloads).
- [ ] Unknown `reference_type` → safe fallback (home or notifications list).
- [ ] In-app bell list: reuse the same resolver when a row has `reference_type` / `reference_id` (transactional notifications only today; broadcast does not insert inbox rows unless added later).

---

## Security (broadcast endpoint)

`POST /api/internal/push/broadcast` is **publicly reachable** on the internet but protected by design:

| Control               | Behavior                                                                                                                                              |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Shared secret**     | Header `x-internal-push-secret` must match env `INTERNAL_PUSH_API_SECRET` (timing-safe compare). Wrong secret → `401`.                                |
| **Fails closed**      | If `INTERNAL_PUSH_API_SECRET` is unset → `503` (endpoint disabled).                                                                                   |
| **Rate limits**       | 30 requests/hour per IP (all attempts); **5 full broadcasts/hour** per IP (no `testEmail`). Uses Upstash when configured, in-memory fallback locally. |
| **Body size**         | Rejects JSON bodies over 8 KiB (`Content-Length`).                                                                                                    |
| **Field length caps** | `title` ≤ 120, `body` ≤ 500, `reference_type` ≤ 64, `reference_id` ≤ 256 chars.                                                                       |
| **No DB writes**      | Broadcast only reads `user_push_tokens` and calls Expo — cannot modify user data.                                                                     |
| **Deep link data**    | Only `reference_type` / `reference_id` strings are forwarded; mobile app decides navigation (no arbitrary URLs from server today).                    |

**Ops checklist:** use a long random production secret (`openssl rand -hex 32`), never commit it, store only in Vercel env. Rotate if leaked.

---

## Environment (web server)

| Variable                   | Role                                                 |
| -------------------------- | ---------------------------------------------------- |
| `EXPO_ACCESS_TOKEN`        | Expo Push API credential — required for any delivery |
| `INTERNAL_PUSH_API_SECRET` | Shared secret for `/api/internal/push/*` routes      |

Set the same values in production (e.g. Vercel) before sending live broadcasts.

---

## Adding a new destination later

1. **Mobile:** add screen slug (or entity type) to the routing table and `linking` config.
2. **Ops:** use that slug in the next broadcast `data` payload.
3. **No server deploy required** for new screen slugs — only `reference_type` / `reference_id` strings change.

If a new slug requires server validation (e.g. allowlist), extend `parseInternalPushBroadcastBody` in `src/features/push/server/internalPushBroadcastParse.ts`.

---

## Related contracts

| Doc                                   | Overlap                                                             |
| ------------------------------------- | ------------------------------------------------------------------- |
| `mobile-owner-create-booking.md`      | Transactional booking push after owner creates booking              |
| `mobile-stripe-connect-onboarding.md` | `servicelinkmobile://payments/connect` deep links                   |
| `mobile-maintenance-enrollment.md`    | Maintenance feature; use `screen` → `maintenance` for announcements |

---

## Changelog

| Date       | Change                                                                   |
| ---------- | ------------------------------------------------------------------------ |
| 2026-07-22 | Added `screen` → `qr_code` slug + example broadcast payload              |
| 2026-07-02 | Initial contract: push payload, routing tables, broadcast API, test mode |
