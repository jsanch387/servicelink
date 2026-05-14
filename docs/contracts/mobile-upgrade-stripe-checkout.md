# Contract: Mobile paywall — Upgrade / resubscribe (Stripe Checkout)

When a user is **paywalled** (trial ended, subscription canceled or ended, `past_due` / `unpaid`, etc.) and taps **Upgrade to Pro**, the Expo app calls the same checkout endpoint as web. The server returns a Stripe-hosted **Checkout URL**; the app opens it in an in-app browser. **Webhooks** apply entitlement after payment; the app must **refetch** `profiles` after return.

This flow is **not** the onboarding free-trial bridge (different JSON body and different success/cancel env vars).

---

## Endpoint

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/stripe/create-checkout-session` |
| **Example (local)** | `http://localhost:3000/api/stripe/create-checkout-session` |

---

## Authentication

| Header | Value |
|--------|--------|
| `Authorization` | `Bearer <Supabase access_token>` |
| `Content-Type` | `application/json` |

---

## Request body (JSON)

**Paywall upgrade / resubscribe (required shape):**

```json
{
  "client": "mobile"
}
```

| Field | Value | Notes |
|-------|--------|--------|
| `client` | `"mobile"` | Required so success/cancel use **upgrade** deep links (see env below). |
| `source` | **omit** | Do **not** send `onboarding_trial_bridge` here — that path is for onboarding step 5 only and uses different redirects + trial rules. |

---

## Success response

**HTTP:** `200`

```json
{
  "success": true,
  "url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

Open `url` in the system / in-app browser.

---

## One Stripe Customer, new subscription when returning

- If `profiles.stripe_customer_id` is **set**, Checkout is created with `customer: <stripe_customer_id>`. Stripe **reuses** that Customer (no second `cus_…` for the same person).
- Completing Checkout creates a **new** Stripe **subscription** attached to that Customer. A canceled subscription is **not** reactivated by ID; the new `sub_…` replaces the old one in `profiles` via **`checkout.session.completed`** (same as web). This is expected Stripe behavior and avoids duplicate customers.

If `stripe_customer_id` is still **null** (never completed a paid checkout), Checkout uses `customer_email`; first success creates the Customer and the webhook stores `stripe_customer_id`.

---

## Trial behavior (onboarding vs upgrade)

- **This contract (paywall upgrade):** no 7-day trial in Checkout — user is subscribing/paying as in the normal web upgrade path.
- **Onboarding trial** (`source: onboarding_trial_bridge`): 7-day trial **only** when the profile has **no** `stripe_customer_id` yet. If `stripe_customer_id` already exists, the server **does not** attach a second free trial (same guard as a returning Stripe customer).

---

## Server environment (this repo)

Always required:

- `STRIPE_SECRET_KEY`
- `STRIPE_PRO_PRICE_ID`

Mobile Checkout return URLs for **`client: "mobile"`** (onboarding vs paywall) are fixed in **`src/libs/stripe/mobileSubscriptionCheckoutRedirects.ts`** — no env vars.

Onboarding mobile URLs (`MOBILE_ONBOARDING_CHECKOUT_*`) are **not** used for paywall upgrade.

---

## Metadata (informational)

Checkout session metadata includes:

- `userId` — Supabase user id
- `source` — `"upgrade"` for this flow
- `client` — `"mobile"` when `client: "mobile"` was sent

Webhook treats `checkout.session.completed` like web upgrade (no `completeOnboardingV2` unless `source` is `onboarding_trial_bridge`).

---

## After Stripe

1. Refetch `profiles` (and any cached session) after the browser session ends.
2. Use the same entitlement rules as web (see [`mobile-entitlement-paywall.md`](./mobile-entitlement-paywall.md)).

Suggested refetch: immediate, then backoff (e.g. 2s, 4s, 8s) until `subscription_status` / tier reflect success or cap attempts.

---

## Error semantics (stable)

| HTTP | When |
|------|------|
| `401` | Missing/invalid Bearer token. |
| `500` | Missing env (`STRIPE_PRO_PRICE_ID`, upgrade mobile URLs), Stripe error, or internal error. |

User-facing copy: map to friendly strings; do not rely on raw `error` text as permanent UI keys.

---

## Example: `curl` (local)

```bash
curl -sS -X POST 'http://localhost:3000/api/stripe/create-checkout-session' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"client":"mobile"}'
```

---

## Related contracts

- Onboarding free trial: [`mobile-onboarding-stripe-checkout.md`](./mobile-onboarding-stripe-checkout.md)
- Manage subscription (portal): [`mobile-billing-portal.md`](./mobile-billing-portal.md)
- Paywall vs access fields: [`mobile-entitlement-paywall.md`](./mobile-entitlement-paywall.md)
