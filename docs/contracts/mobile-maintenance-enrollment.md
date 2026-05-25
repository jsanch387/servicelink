# Contract: Mobile — Send maintenance detail invite

Use this when the **signed-in business owner** sends a **maintenance detail invite** to an existing CRM customer from the native app. The server runs the **same** handler as the web CRM flow (`EnrollMaintenanceModalBody` → `POST /api/maintenance/enrollments`): it creates the `maintenance_enrollments` row, stores the invite token, emails the customer when possible, and returns the public magic link for manual copy (SMS / no-email customers).

**Do not** insert rows directly into Supabase from the app for this flow — you would skip token hashing, invite email, payment-mode snapshot, calendar slot checks, and pending-invite guards.

**Implementation:** `POST /api/maintenance/enrollments` in `src/app/api/maintenance/enrollments/route.ts`  
**Core logic:** `createMaintenanceEnrollmentForOwner` in `src/features/maintenance/server/createMaintenanceEnrollmentForOwner.ts`  
**Validation:** `parseMaintenanceEnrollmentBody` in `src/features/maintenance/server/parseMaintenanceEnrollmentBody.ts`  
**Structured logs:** `maintenanceEnrollmentRouteLog.ts` (no raw tokens or full invite URLs)

---

## Endpoint

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/maintenance/enrollments` |
| **Production** | `https://myservicelink.app/api/maintenance/enrollments` (or your `NEXT_PUBLIC_SITE_URL` + path) |
| **Local** | `http://localhost:3000/api/maintenance/enrollments` |

---

## Authentication (required)

| Header | Value |
|--------|--------|
| `Authorization` | `Bearer <Supabase session access_token>` |
| `Content-Type` | `application/json` |

The access token is the same JWT the Expo app already uses for other authenticated API routes (e.g. owner booking, Stripe Connect).

**Web (cookies):** The same path also accepts Supabase session cookies from the dashboard. Mobile must use Bearer auth.

**Behavior:** Server resolves the user with `getAuthenticatedUser`. For Bearer requests, **`businessId`** in the body must match the authenticated owner’s business (`business_profiles.profile_id = auth.uid()`). Mismatch → **403 Forbidden**.

---

## Request tracing (recommended)

Send one of:

- `X-Request-ID: <opaque string>`
- `X-Correlation-ID: <opaque string>`

Server echoes the id in structured logs (`req=…`) and response header **`X-Request-ID`**. Log this next to HTTP status on failures so support can correlate mobile ↔ server logs.

**Do not** log `customerViewUrl` or raw invite tokens in mobile analytics — they grant customer access.

---

## Request body (JSON)

### Required fields (all clients)

| Field | Type | Notes |
|-------|------|--------|
| `customerId` | string | UUID of an existing `customers` row for this business. |
| `priceCents` | number | Integer ≥ 0. Price in cents (e.g. `10000` = $100). |
| `durationMinutes` | number | Integer ≥ 30. Visit length in minutes. |

### Optional fields (all clients)

| Field | Type | Notes |
|-------|------|--------|
| `serviceNameSnapshot` | string | Defaults to `"Maintenance"`. Stored on the enrollment row. |
| `durationHHmm` | string | Alternative to `durationMinutes` (e.g. `"02:00"` → 120 min). Ignored when `durationMinutes` is a valid number. |
| `anchorDate` | string | `YYYY-MM-DD`. First visit date. Omit both date and time so the customer picks on the link. |
| `anchorTime` | string | `HH:mm` (24h). Required when `anchorDate` is set; must be omitted when date is omitted. |

### Mobile-only fields (Bearer auth)

| Field | Type | Required | Notes |
|-------|------|----------|--------|
| `businessId` | string | **Yes** | UUID of `business_profiles.id`. Must equal the authenticated owner’s business. |
| `businessSlug` | string | Recommended | When present, must match the slug on the business row (consistency check, same pattern as owner booking). |

### Example (mobile)

```json
{
  "businessId": "uuid-of-business_profiles-row",
  "businessSlug": "acme-detail",
  "customerId": "uuid-of-customers-row",
  "serviceNameSnapshot": "Maintenance",
  "priceCents": 10000,
  "durationMinutes": 120,
  "anchorDate": "2026-06-15",
  "anchorTime": "10:00"
}
```

### Example (no anchor — customer picks date on link)

```json
{
  "businessId": "uuid-of-business_profiles-row",
  "businessSlug": "acme-detail",
  "customerId": "uuid-of-customers-row",
  "priceCents": 8000,
  "durationMinutes": 90
}
```

---

## Success response

**HTTP:** `201 Created`

Response headers: **`X-Request-ID`**, **`Cache-Control: no-store`**.

```json
{
  "success": true,
  "data": {
    "id": "<new maintenance_enrollments uuid>",
    "customerViewUrl": "https://myservicelink.app/maintenance/e/<opaque-token>",
    "emailSent": true,
    "notifiedEmail": "customer@example.com"
  }
}
```

| Field | Notes |
|-------|--------|
| `id` | New enrollment row id. |
| `customerViewUrl` | Full public URL — share via SMS when email was not sent. **Treat as secret.** |
| `emailSent` | `true` when Resend accepted the invite email. |
| `notifiedEmail` | Present only when `emailSent` is true. |
| `emailError` | Present when email was not sent (no inbox, Resend failure, etc.). Enrollment is still created. |

**Server side effects:**

1. Inserts `maintenance_enrollments` with hashed link token + stored invite token for “copy link again.”
2. Snapshots owner payment mode from live payment settings / Connect readiness.
3. When anchor date/time provided: validates calendar availability before insert.
4. Sends invite email via Resend when customer has a valid email on file.
5. Updates `email_sent_at` / `last_notification_error` on the enrollment row.

The customer completes acceptance on the web magic link (`/maintenance/e/{token}`) — anchor (if needed), pay in person or card checkout. That flow is **not** duplicated in mobile.

---

## Feature flow (what happens after create)

High-level lifecycle — same on web CRM and mobile customer detail:

```text
Owner sends invite (this API)
  → enrollment row: status ≈ enrolled_pending_customer, payment_status pending
  → customer gets email and/or owner copies customerViewUrl (SMS)

Customer opens magic link (web only)
  → optional: sets first visit date/time if owner left anchor blank
  → pays in person OR Stripe Checkout (depends on business payment settings)

Server accepts enrollment
  → status → accepted
  → payment_status → paid (card) or pay_in_person
  → first visit booking created on owner calendar (idempotent)
  → confirmation emails (best-effort)

After first linked visit completes
  → status may become visit_completed
  → customers.maintenance_visits_completed increments (when booking completes)
```

Mobile does **not** need to implement the customer link flow. After `POST /api/maintenance/enrollments` succeeds, refresh the customer record and drive UI from `maintenanceEnrollment` (see below).

---

## After you create an invite (mobile UX)

Use the **201 response** immediately:

| Response field | Mobile UI suggestion |
|----------------|----------------------|
| `data.id` | Store as enrollment id; use after refresh to match `maintenanceEnrollment.enrollmentId`. |
| `data.customerViewUrl` | Show on success screen when `emailSent` is false, or as **Copy link** fallback when email failed (`emailError`). Do not persist in analytics. |
| `data.emailSent` | `true` → “Invite sent” + optional masked inbox hint from `notifiedEmail`. |
| `data.emailError` | Show when email did not send; enrollment still exists — prompt owner to copy link. |

Then **reload customer data** (e.g. `GET /api/customers` or your existing customer-detail fetch) so the profile shows the new maintenance block. Web does the same via client refresh after modal success.

**Send another invite:** While the latest enrollment is **pending** and has a stored invite token, the server returns **409** on a second create, and web disables **Send maintenance invite**. Mirror that: disable the CTA when `maintenanceEnrollment` indicates a pending invite (see **Status & labels**).

---

## Customer profile data (`maintenanceEnrollment`)

When a customer has at least one enrollment, `GET /api/customers` attaches the **latest** row per customer (`created_at` desc) on each record as `maintenanceEnrollment`. Shape matches web `CustomerMaintenanceEnrollmentSummary`:

```json
{
  "maintenanceEnrollment": {
    "enrollmentId": "uuid",
    "status": "enrolled_pending_customer",
    "paymentStatus": "pending",
    "serviceNameSnapshot": "Maintenance",
    "priceCents": 10000,
    "frequencyWeeks": 0,
    "durationMinutes": 120,
    "anchorDate": "2026-06-15",
    "anchorTime": "10:00:00",
    "inviteToken": "opaque-token-for-copy-link"
  }
}
```

| Field | Notes |
|-------|--------|
| `enrollmentId` | Same as `data.id` from create response. |
| `status` | Primary lifecycle (see table below). |
| `paymentStatus` | `pending`, `paid` (card), `pay_in_person`, etc. |
| `serviceNameSnapshot` | Display label (server normalizes to “Maintenance detail” when applicable). |
| `priceCents` / `durationMinutes` | Plan snapshot from invite. |
| `frequencyWeeks` | Legacy column; currently `0` for new invites (not shown in web UI). |
| `anchorDate` / `anchorTime` | First visit when set; placeholder sentinel rows show as **Not set yet** in UI helpers. |
| `inviteToken` | Present on new invites — rebuild public URL as `{SITE_URL}/maintenance/e/{inviteToken}` for **Copy invite link** only. `null` on older rows. |

Also on the customer record: `maintenanceVisitsCompleted` (integer) — completed maintenance-plan visits tracked on the `customers` row, independent of the latest enrollment card.

**Web CRM block (parity target):** When `maintenanceEnrollment` is non-null, customer detail shows a **Maintenance detail** card with status chip, subtitle line, **View details** (price, duration, anchor, payment, copy link), and **Send maintenance invite** in Actions (disabled while pending).

---

## Status & labels (CRM parity with web)

Map `status` + `paymentStatus` to owner-facing copy (see `customerMaintenanceEnrollmentLabels.ts`):

| `status` | Typical subtitle / chip | Owner actions |
|----------|-------------------------|---------------|
| `enrolled_pending_customer` | **Waiting on customer** · chip **Pending** | **Send invite** disabled if `inviteToken` present; **View details** → copy link |
| `accepted` + `paymentStatus` `paid` | **Paid · card** · chip **Confirmed** | New invite allowed when prior invite is no longer pending |
| `accepted` + `pay_in_person` | **Confirmed · pay in person** | Same |
| `accepted` (other payment) | **Confirmed** | Same |
| `visit_completed` | **Visit completed · send another…** | **Send invite** enabled again |
| `cancelled` | **Cancelled** | Product-specific; new invite may be allowed |

**Pending guard (matches server 409):** Treat as blocking a new invite when `inviteToken` is set **and** status is still `enrolled_pending_customer` (same as `maintenanceEnrollmentBlocksNewOwnerInvite` on web).

**Anchor display:** If owner set date/time on invite, show formatted date + time; otherwise **Not set yet** until customer picks on the link (or owner set anchor at create time).

---

## What the customer does (web link — reference only)

For support / debugging, not for mobile implementation:

1. Open `customerViewUrl` / `/maintenance/e/{token}`.
2. Confirm or choose first visit date/time (if not preset).
3. **Pay in person** or **Pay with card** (Stripe Checkout) per business settings.
4. First visit appears on the owner’s availability calendar; owner gets the usual booking notifications.

If `anchorDate` / `anchorTime` were sent in the create body, the customer skips picking a date when those values are already real (non-placeholder) on the enrollment.

---

## Error responses

Body shape:

```json
{
  "success": false,
  "error": "<English message>"
}
```

| HTTP | Typical cause |
|------|----------------|
| `400` | Invalid JSON, missing fields, anchor date/time mismatch, slug mismatch. |
| `401` | Missing/invalid Bearer token (`code: "UNAUTHORIZED"` when using Bearer). |
| `403` | Authenticated user is not the owner of `businessId`. |
| `404` | Customer not found for this business, or business not found. |
| `409` | Calendar slot unavailable for anchor, or customer already has a **pending** invite with a stored token. |
| `500` | Unexpected failure (DB, payment settings load, etc.). |

---

## Security checklist

| Requirement | Detail |
|-------------|--------|
| **HTTPS** | All production calls must use TLS. |
| **Auth** | Bearer access token only from mobile — never service role key. |
| **Business ownership** | `businessId` must match owner’s `business_profiles` row. |
| **Customer scope** | `customerId` must belong to the same `business_id`. |
| **Secrets** | Do not log or persist `customerViewUrl` in analytics; store enrollment `id` instead. |
| **Pending invite guard** | Server rejects a second invite while one is still pending (matches web CRM disable behavior). |

---

## Related code

| Piece | Location |
|-------|----------|
| Route handler | `src/app/api/maintenance/enrollments/route.ts` |
| Customer list + enrollment attach | `GET /api/customers` → `loadLatestMaintenanceEnrollmentByCustomerIds` |
| CRM labels / pending guard | `src/features/customer-management/utils/customerMaintenanceEnrollmentLabels.ts` |
| Customer detail UI (web reference) | `src/features/customer-management/components/CustomerDetailPanel.tsx` |
| Auth helper | `src/libs/api/getAuthenticatedUser.ts` |
| Owner business resolution | `src/server/resolveCurrentBusinessId.ts` |
| Customer public flow (after link) | `src/app/maintenance/e/[token]/page.tsx` |
| Feature overview | `src/features/maintenance/docs/README.md` |
| Similar mobile contract | `docs/contracts/mobile-owner-create-booking.md` |
