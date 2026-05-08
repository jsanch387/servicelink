# Contract: Mobile onboarding — Stripe free trial checkout

ServiceLink **web API** (this repo) creates a Stripe Checkout session for onboarding step 5 (“start free trial”). The **Expo app** opens the returned `url` in an in-app browser; Stripe redirects back using **deep link URLs** configured on the server. Subscription and onboarding completion are applied by the **existing Stripe webhook** (`checkout.session.completed`); the app should **refetch** user/profile after the browser closes.

---

## Endpoint

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/stripe/create-checkout-session` |
| **Local base URL** | `http://localhost:3000` (or whatever port `next dev` uses) |
| **Full URL (local)** | `http://localhost:3000/api/stripe/create-checkout-session` |

Use HTTPS in non-local environments (e.g. production or a tunnel like ngrok if the device cannot reach your machine’s `localhost`).

---

## Authentication

| Header | Value |
|--------|--------|
| `Authorization` | `Bearer <Supabase access_token>` |
| `Content-Type` | `application/json` |

Same JWT the app already uses for Supabase-authenticated API calls. Cookie-based web sessions are not required for this call.

---

## Request body (JSON)

Required shape for **onboarding trial from mobile**:

```json
{
  "source": "onboarding_trial_bridge",
  "client": "mobile"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|--------|
| `source` | string | Yes for this flow | Must be exactly `onboarding_trial_bridge` to enable 7-day trial + onboarding completion in webhook. |
| `client` | string | Yes for deep-link returns | Must be exactly `mobile` so success/cancel URLs use server env (see below). |

---

## Success response

**HTTP:** `200`

**Body:**

```json
{
  "success": true,
  "url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

The client **opens `url`** in the system / in-app browser (not an embedded WebView if your auth guidelines require otherwise, follow product rules).

---

## Error responses

| HTTP | Body shape | Typical cause |
|------|------------|----------------|
| `401` | `{ "success": false, "error": "..." }` | Missing/invalid/expired Bearer token. |
| `500` | `{ "success": false, "error": "..." }` | Misconfiguration (e.g. missing `STRIPE_PRO_PRICE_ID`, missing mobile return URL envs, Stripe API error). |

---

## Server environment (this repo)

Required for any checkout:

- `STRIPE_SECRET_KEY`
- `STRIPE_PRO_PRICE_ID`

Required **only** when body includes `source: onboarding_trial_bridge` **and** `client: mobile` (otherwise checkout uses normal web redirect URLs):

- `STRIPE_MOBILE_ONBOARDING_SUCCESS_URL` — full URL Stripe redirects to after **success** (e.g. `servicelinkmobile://onboarding/stripe?result=success` or an `https://` bridge).
- `STRIPE_MOBILE_ONBOARDING_CANCEL_URL` — full URL for **cancel**.

If those two are unset in that mobile+onboarding case, the API returns `500` with an explicit error message.

### Example `.env.local` (local dev)

Use **quotes** so `?` and `=` are not misread by your shell or editor:

```bash
STRIPE_MOBILE_ONBOARDING_SUCCESS_URL="servicelinkmobile://onboarding/stripe?result=success"
STRIPE_MOBILE_ONBOARDING_CANCEL_URL="servicelinkmobile://onboarding/stripe?result=cancel"
```

After changing env vars, **restart** `next dev` so Next.js reloads them.

### Server logs

Look for the prefix **`[stripe:create-checkout-session]`** in the terminal where `npm run dev` runs. Useful lines include auth failures, missing mobile URL env errors, `checkout session created` (Stripe session ids are not logged), and Stripe errors.

---

## Client behavior after Stripe

1. User completes or cancels Checkout; Stripe redirects to the success or cancel URL above.
2. **Do not** rely only on the deep link query string for entitlements.
3. After the browser session ends, **reload** profile / onboarding state from your backend (or Supabase with RLS) so data reflects the webhook (`completeOnboardingV2`, Pro trial fields, etc.).

---

## Example: `curl` (local)

Replace `YOUR_ACCESS_TOKEN` and host/port as needed.

```bash
curl -sS -X POST 'http://localhost:3000/api/stripe/create-checkout-session' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"source":"onboarding_trial_bridge","client":"mobile"}'
```

Expected: JSON with `success: true` and a `url` starting with `https://checkout.stripe.com/` (test mode when using test API keys).

---

## Paywall upgrade (different contract)

After onboarding, when the user is paywalled and taps **Upgrade to Pro**, use **`{ "client": "mobile" }` only** (no `onboarding_trial_bridge`) and set **`STRIPE_MOBILE_UPGRADE_SUCCESS_URL`** / **`STRIPE_MOBILE_UPGRADE_CANCEL_URL`**. See [`mobile-upgrade-stripe-checkout.md`](./mobile-upgrade-stripe-checkout.md).

---

## Versioning

No explicit API version in the path. Breaking changes to this contract should be announced to the mobile team; prefer additive fields on responses if possible.
