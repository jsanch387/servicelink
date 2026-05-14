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
| `client` | string | Must be exactly `"mobile"` to use the fixed Expo **`return_url`** (`MOBILE_BILLING_PORTAL_RETURN_URL` in `src/libs/stripe/mobileSubscriptionCheckoutRedirects.ts`). |

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
| `500` | Stripe misconfiguration or Stripe API error. |

---

## Environment (this repo)

Always required for portal:

- `STRIPE_SECRET_KEY`

When the body includes **`client: "mobile"`**, Stripe **`return_url`** is **`servicelinkmobile://settings/subscription`** (constant `MOBILE_BILLING_PORTAL_RETURN_URL` in `src/libs/stripe/mobileSubscriptionCheckoutRedirects.ts`). No env var for that path.

## After the user returns

Stripe fires webhook events (e.g. `customer.subscription.updated`). Reload subscription fields from your API / Supabase; do not trust only the deep link for entitlement state.

---

## Logs

Server logs use prefix **`[stripe:create-portal-session]`** — auth failures, `portal session created` (no Stripe session ids logged), and errors.

---

## Example: `curl` (local)

```bash
curl -sS -X POST 'http://localhost:3000/api/stripe/create-portal-session' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"client":"mobile"}'
```
