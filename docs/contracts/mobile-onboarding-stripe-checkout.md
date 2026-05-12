# Contract: Mobile onboarding — Pro trial (Checkout or silent API)

ServiceLink **web API** (this repo) supports two ways to start the onboarding step 5 trial:

1. **Stripe Checkout (legacy / fallback)** — `POST /api/stripe/create-checkout-session` returns a `url`; the app opens it; Stripe redirects back via deep link. **Subscription rows and trial dates live in Stripe**; the app should call **`POST /api/stripe/confirm-onboarding-trial`** after success so the response includes **`trial_confirmation`** (DB + Stripe) without racing the webhook alone.
2. **Silent subscription (recommended when supported)** — `POST /api/stripe/start-onboarding-trial` with the same Bearer auth **creates the subscription in Stripe without Checkout** and returns **`trial_confirmation` immediately** (same shape as confirm).

---

## Shared: `trial_confirmation` (success payloads)

Whenever the server finishes a trial activation path (silent API, confirm-after-checkout, or “already active” idempotent retry), responses may include:

| Field | Type | Description |
|-------|------|---------------|
| `success` | `boolean` | Request succeeded. |
| `trial_confirmation` | `object` \| omitted | Present when the profile could be loaded. Authoritative merge of **Supabase `profiles`** and **Stripe `Subscription`**. |

### `trial_confirmation` object

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | `string` | Supabase auth / `profiles.user_id`. |
| `onboarding_status` | `string \| null` | e.g. `completed` after onboarding bridge. |
| `subscription_tier` | `string \| null` | e.g. `pro`. |
| `subscription_status` | `string \| null` | From DB (mirrors Stripe after sync), e.g. `trialing`, `active`. |
| `stripe_customer_id` | `string \| null` | Stripe Customer id on the profile. |
| `stripe_subscription_id` | `string \| null` | Stripe Subscription id on the profile. |
| `subscription_current_period_end` | `string \| null` | ISO timestamp from DB (billing period end). |
| `stripe` | `object` | Fields read live from Stripe when `stripe_subscription_id` is set. |
| `stripe.subscription_id` | `string \| null` | Same as profile subscription id when retrieved. |
| `stripe.status` | `string \| null` | Stripe subscription status (e.g. `trialing`). |
| `stripe.trial_start` | `string \| null` | ISO start of trial from Stripe (null if not trialing / no trial). |
| `stripe.trial_end` | `string \| null` | ISO end of trial from Stripe (null if not applicable). |

**Mobile should** treat `trial_confirmation` as the source of truth for “trial is active” UI after a successful response, and still listen for profile refresh from Supabase/webhooks for later changes (cancel, past_due, etc.).

---

## A) Start Checkout (unchanged URL flow)

### Endpoint

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/stripe/create-checkout-session` |
| **Full URL (local)** | `http://localhost:3000/api/stripe/create-checkout-session` |

Use HTTPS in production (or a tunnel if the device cannot reach your machine).

### Authentication

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer <Supabase access_token>` |
| `Content-Type` | `application/json` |

### Request body (JSON)

```json
{
  "source": "onboarding_trial_bridge",
  "client": "mobile"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `source` | string | Yes | Must be `onboarding_trial_bridge` for 7-day trial + onboarding completion metadata on the session. |
| `client` | string | Yes | Must be `mobile` for mobile success/cancel URLs from env. |

### Success response (HTTP `200`)

```json
{
  "success": true,
  "url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "trial_checkout_followup": {
    "confirm_session": {
      "method": "POST",
      "path": "/api/stripe/confirm-onboarding-trial",
      "body_json_shape": {
        "checkout_session_id": "string"
      }
    }
  }
}
```

- `trial_checkout_followup` is present **only** for this mobile + onboarding combination. Use it to know **where** to confirm after Checkout.
- `url` — open in the in-app / system browser as before.

### Configure success URL with session id

So the app can call confirm with the session id, set **`STRIPE_MOBILE_ONBOARDING_SUCCESS_URL`** to include Stripe’s placeholder, for example:

`servicelinkmobile://onboarding/stripe?result=success&session_id={CHECKOUT_SESSION_ID}`

Parse `session_id` (or whatever query name you use) and send it as **`checkout_session_id`** in the confirm request body.

---

## B) Confirm after Checkout (new — trial snapshot + optional sync)

Call when the user returns from Stripe with a **completed** session (or poll with the session id until `checkout_session_status` is `complete`).

### Endpoint

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/stripe/confirm-onboarding-trial` |

### Authentication

Same Bearer token as Checkout.

### Request body (JSON)

**After Checkout (recommended):**

```json
{
  "checkout_session_id": "cs_test_..."
}
```

**Poll current trial state (no session id):**

```json
{}
```

An empty body returns the latest **`trial_confirmation`** from DB + Stripe for the signed-in user (useful if the webhook already ran and you only need to refresh UI).

### Success responses (HTTP `200`)

**Checkout complete — profile synced from session:**

```json
{
  "success": true,
  "synced_from_checkout": true,
  "trial_confirmation": { "...": "see table above" }
}
```

**Checkout not complete yet (user returned early or Stripe still processing):**

```json
{
  "success": true,
  "checkout_pending": true,
  "checkout_session_status": "open",
  "synced_from_checkout": false,
  "trial_confirmation": { "...": "current DB + Stripe; may update after completion" }
}
```

**No `checkout_session_id` (profile poll):**

```json
{
  "success": true,
  "synced_from_checkout": false,
  "trial_confirmation": { "...": "see table above" }
}
```

### Error responses (selected)

| HTTP | When |
|------|------|
| `400` | Invalid `checkout_session_id`, wrong session `mode`, or session not tagged `onboarding_trial_bridge`. |
| `403` | Session metadata `userId` does not match the Bearer user. |
| `401` | Missing/invalid token. |

The confirm handler applies the **same** profile + onboarding updates as the Stripe webhook for a completed onboarding subscription session (idempotent if the webhook already ran).

---

## C) Silent trial (optional mobile path — no Checkout)

Same as web: **`POST /api/stripe/start-onboarding-trial`** with Bearer auth and **no** body (or `{}`). On success:

```json
{
  "success": true,
  "trial_confirmation": { "...": "see table above" }
}
```

If the user already has an active/trialing subscription:

```json
{
  "success": true,
  "alreadyActive": true,
  "trial_confirmation": { "...": "see table above" }
}
```

If Stripe rejects silent creation, the API may return **`fallbackToCheckout: true`** — then use flow **A** + **B**.

---

## Client checklist (Checkout flow)

1. `POST /api/stripe/create-checkout-session` with `source` + `client`; open `url`.
2. On success deep link, read **`checkout_session_id`** (from `session_id` in your success URL).
3. `POST /api/stripe/confirm-onboarding-trial` with `{ "checkout_session_id": "..." }` until `synced_from_checkout === true` (or `checkout_pending` is false and `trial_confirmation.subscription_status` is `trialing` / `active`).
4. Drive UI from **`trial_confirmation`**; keep periodic profile sync for long-lived state.

---

## Server environment

Same as before: `STRIPE_SECRET_KEY`, `STRIPE_PRO_PRICE_ID`, and for Checkout flow **`STRIPE_MOBILE_ONBOARDING_SUCCESS_URL`** / **`STRIPE_MOBILE_ONBOARDING_CANCEL_URL`**.

Confirm + silent routes additionally rely on **`SUPABASE_SECRET_KEY`** or **`SUPABASE_SERVICE_ROLE_KEY`** (service role) for applying checkout completion when the client calls confirm (same as webhook).

---

## Example `curl`: confirm after Checkout

```bash
curl -sS -X POST 'http://localhost:3000/api/stripe/confirm-onboarding-trial' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"checkout_session_id":"cs_test_..."}'
```

---

## Paywall upgrade (different contract)

Use **`POST /api/stripe/create-checkout-session`** with **`{ "client": "mobile" }` only** (no `onboarding_trial_bridge`). Confirm endpoint **rejects** sessions whose `metadata.source` is not `onboarding_trial_bridge`. For upgrades, refetch profile or add a separate contract later if you need a similar confirmation payload.

---

## Server debugging (ServiceLink repo)

Verbose **`console.debug`** lines for these flows use the tag **`[stripe:onboarding:<scope>]`** (for example `create-checkout`, `start-trial`, `confirm-trial`, `trial-payload`, `apply-checkout`). They are **off by default** in every environment.

Set **`DEBUG_STRIPE_ONBOARDING=1`** to enable them (local, staging, or production).

API routes still emit minimal **`console.info`** (success) and **`console.warn`** / **`console.error`** (failures) without this flag.

Logs avoid email addresses and payment method details; verbose mode may include `userId`, truncated Stripe id suffixes, and status fields.

---

## Versioning

Responses are **additive**: new fields may appear on `trial_confirmation` or top-level success objects. Breaking path or auth changes should be coordinated with the mobile team.
