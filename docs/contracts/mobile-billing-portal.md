# Contract: Mobile — Manage subscription (Stripe Customer Portal)

Opens Stripe’s **hosted Customer Portal** so the user can update payment method, cancel, or manage billing. Same backend behavior as web; mobile sends a Bearer token and optional `client: "mobile"` so Stripe redirects back into the app.

---

## Endpoint

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/stripe/create-portal-session` |
| **Example (local)** | `http://localhost:3000/api/stripe/create-portal-session` |

---

## Authentication

| Header | Value |
|--------|--------|
| `Authorization` | `Bearer <Supabase access_token>` |
| `Content-Type` | `application/json` |

---

## Request body (JSON)

For mobile:

```json
{
  "client": "mobile"
}
```

Web can send an empty body `{}` or omit parsing issues — behavior unchanged (`return_url` stays `{SITE}/dashboard/settings`).

| Field | Type | Notes |
|-------|------|--------|
| `client` | string | Must be exactly `"mobile"` to use `STRIPE_MOBILE_BILLING_PORTAL_RETURN_URL`. |

---

## Success response

**HTTP:** `200`

```json
{
  "success": true,
  "url": "https://billing.stripe.com/p/session/..."
}
```

Open `url` in the native / in-app browser.

---

## Error responses

| HTTP | Typical meaning |
|------|------------------|
| `401` | Invalid or missing Bearer token. |
| `400` | `No billing account found` — user has no `profiles.stripe_customer_id` yet (needs checkout first). |
| `500` | Stripe misconfiguration, missing `STRIPE_MOBILE_BILLING_PORTAL_RETURN_URL` when `client` is `mobile`, or Stripe API error. |

---

## Environment (this repo)

Always required for portal:

- `STRIPE_SECRET_KEY`

Required when body includes **`client: "mobile"`**:

- `STRIPE_MOBILE_BILLING_PORTAL_RETURN_URL` — quoted deep link or HTTPS bridge, e.g.

```bash
STRIPE_MOBILE_BILLING_PORTAL_RETURN_URL="servicelinkmobile://settings/subscription"
```

Restart Next after editing `.env.local`.

---

## After the user returns

Stripe fires webhook events (e.g. `customer.subscription.updated`). Reload subscription fields from your API / Supabase; do not trust only the deep link for entitlement state.

---

## Logs

Server logs use prefix **`[stripe:create-portal-session]`** — auth failures, missing mobile return URL, `portal session created` (no Stripe session ids logged), and errors.

---

## Example: `curl` (local)

```bash
curl -sS -X POST 'http://localhost:3000/api/stripe/create-portal-session' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"client":"mobile"}'
```
