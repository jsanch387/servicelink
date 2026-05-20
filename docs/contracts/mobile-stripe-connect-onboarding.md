# Contract: Mobile — Stripe Connect Express onboarding (payments setup)

Pro owners turn on **Stripe Connect** so ServiceLink can collect booking payments on their **connected Express account**. The web app uses `POST /api/stripe/connect/onboard` with cookies; the Expo app uses the **same endpoint** with a **Bearer** token and `client: "mobile"` so Stripe’s Account Link sends the user back into the app via **env-configured** `return_url` and `refresh_url`.

After Stripe redirects back, the app must **sync** local state from Stripe (same as web’s `/dashboard/payments?connect=return`).

**Web parity reference (source of truth for UI rules):**

- Server props: `src/app/dashboard/payments/page.tsx`
- Client layout: `src/features/payments/components/PaymentsPage.tsx`
- Stripe → DB sync: `src/features/payments/server/syncConnectPaymentAccount.ts`

---

## Endpoints

| Purpose                                               | Method | Path                               |
| ----------------------------------------------------- | ------ | ---------------------------------- |
| Start or resume Connect onboarding                    | `POST` | `/api/stripe/connect/onboard`      |
| Refresh `payment_accounts` from Stripe                | `POST` | `/api/stripe/connect/sync`         |
| Turn on ServiceLink checkout (after Connect is ready) | `POST` | `/api/payments/servicelink/enable` |

**Example (local):** `http://localhost:3000/api/stripe/connect/onboard`

**Central path constants:** `API_ROUTES.STRIPE_CONNECT_ONBOARD`, `API_ROUTES.STRIPE_CONNECT_SYNC`, `API_ROUTES.PAYMENTS_SERVICELINK_ENABLE` in `src/constants/routes.ts`.

---

## Authentication

| Header          | Value                            |
| --------------- | -------------------------------- |
| `Authorization` | `Bearer <Supabase access_token>` |
| `Content-Type`  | `application/json`               |

Same JWT as other authenticated mobile API calls for **onboard** and **sync**. Subscription checkout and billing portal are **not** available on mobile (see `src/app/api/stripe/README.md`).

**`POST /api/payments/servicelink/enable`:** today the handler uses **cookie session only** (`createSupabaseServerClient` + `getUser`). For full mobile parity, either open that URL in an **authenticated WebView** with cookies, or extend the route to accept Bearer the same way as onboard/sync (recommended follow-up).

---

## Start / resume onboarding — request body

**Mobile (required shape):**

```json
{
  "client": "mobile"
}
```

| Field    | Type   | Required           | Notes                                                                                                        |
| -------- | ------ | ------------------ | ------------------------------------------------------------------------------------------------------------ |
| `client` | string | Yes for deep links | Must be exactly `"mobile"` so `return_url` / `refresh_url` use server env vars (not the web dashboard URLs). |

**Web:** may call with an empty body; behavior unchanged (dashboard payments URLs).

### Success response — onboard

**HTTP:** `200`

```json
{
  "success": true,
  "url": "https://connect.stripe.com/setup/s/..."
}
```

Open `url` in the system / in-app browser (not a secret).

**Server behavior (same as web):**

- User must be **Pro** (`getHasProAccessForPayments` → `profiles` + `isProAccess`; see [`mobile-entitlement-paywall.md`](./mobile-entitlement-paywall.md)).
- Resolves current **business** for the authenticated user.
- If no `payment_accounts.stripe_account_id` yet: creates Stripe **Express** `acct_…`, **upserts** `payment_accounts` (`onboarding_status: in_progress`, capability flags false, etc.).
- If `stripe_account_id` already exists: mints a new **Account Link** only (resume).
- Returns Stripe-hosted onboarding URL.

---

## Sync after return — request body

No body required. Example: `{}`.

### Success response — sync

**HTTP:** `200`

When Stripe state was pulled and `payment_accounts` updated:

```json
{
  "success": true,
  "synced": true
}
```

When there is no linked Connect account row yet:

```json
{
  "success": true,
  "synced": false,
  "skipped": true,
  "reason": "no_stripe_account"
}
```

---

## How the database is updated

### A) First “Connect with Stripe” (new `acct_…`)

`POST /api/stripe/connect/onboard` **upserts** `payment_accounts` (on conflict `business_id`):

| Column              | Value (initial)  |
| ------------------- | ---------------- |
| `business_id`       | Current business |
| `provider`          | `stripe`         |
| `stripe_account_id` | New `acct_…`     |
| `onboarding_status` | `in_progress`    |
| `charges_enabled`   | `false`          |
| `payouts_enabled`   | `false`          |
| `details_submitted` | `false`          |

Stripe’s hosted onboarding then updates the **live** account; your DB catches up via **sync** (below), not row-by-row as the user types.

### B) Resume (existing `acct_…`)

No new `accounts.create` — only a new **Account Link**. Existing `payment_accounts` row is unchanged until **sync** runs.

### C) After Stripe redirect — `POST /api/stripe/connect/sync` (or web equivalent)

`syncConnectPaymentAccountForBusiness` (see `syncConnectPaymentAccount.ts`):

1. Loads `payment_accounts` for `business_id` (needs `stripe_account_id`).
2. **`stripe.accounts.retrieve(acct_…)`** — source of truth from Stripe.
3. **Updates** the same row:

| Column                | Source                                                                                |
| --------------------- | ------------------------------------------------------------------------------------- |
| `charges_enabled`     | Stripe `account.charges_enabled`                                                      |
| `payouts_enabled`     | Stripe `account.payouts_enabled`                                                      |
| `details_submitted`   | Stripe `account.details_submitted`                                                    |
| `onboarding_status`   | Derived (see next section)                                                            |
| `requirements_status` | Snapshot of requirements / disabled reason (debug / support)                          |
| `last_synced_at`      | Always set to “now” on success                                                        |
| `connected_at`        | Set once when derived status first becomes **`complete`** and `connected_at` was null |

**Mobile:** call **sync** on every **return** and **refresh** deep link, then **re-query** `payment_accounts` (and `payment_settings`) so your UI matches web after a `router.refresh()` on the payments route.

### D) Turning on ServiceLink checkout (separate step from Connect)

`POST /api/payments/servicelink/enable`:

- Requires **Pro**, same business resolution.
- Requires `payment_accounts` row with **`onboarding_status === 'complete'`** and **`charges_enabled === true`** (same definition as **stripeConnectReady** below). Otherwise **400** with _Finish Stripe setup before turning on ServiceLink payments._
- Creates or updates **`payment_settings`**: sets `payments_enabled: true`, links `payment_account_id`, default deposit/currency fields on first insert.

So: **Connect complete** → owner still sees **“turn on payments”** gate until this endpoint succeeds → then full settings UI (web: `PaymentsPage` dashboard branch).

---

## Stripe → `payment_accounts.onboarding_status`

Implemented in `deriveConnectOnboardingStatus` (used only after a successful **retrieve** in sync):

| Condition                                     | `onboarding_status` |
| --------------------------------------------- | ------------------- |
| `account.requirements.disabled_reason` is set | `restricted`        |
| `details_submitted` **and** `charges_enabled` | `complete`          |
| Otherwise                                     | `in_progress`       |

**UI “ready to charge” for ServiceLink:** web uses stricter than `complete` alone — it also requires **`charges_enabled === true`** (see `stripeConnectReady` below). A row could theoretically be `complete` with `charges_enabled` false during edge transitions; always use the **same boolean** web uses.

---

## What to read from the DB (mobile parity with web)

### 1) Pro access — `profiles`

Use the same inputs as web **`isProAccess`** (see [`mobile-entitlement-paywall.md`](./mobile-entitlement-paywall.md)): `subscription_tier`, `subscription_status`, `stripe_subscription_id`, `stripe_customer_id`, etc.

**`getHasProAccessForPayments`** encapsulates this for server routes; on mobile, mirror with your existing profile fetch + the same `isProAccess` logic (or a small shared API that returns a boolean).

### 2) Connect state — `payment_accounts` (one row per `business_id`, optional until first onboard)

| Column              | Use                                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------- |
| `stripe_account_id` | Absent / null → user has **never** completed first onboard upsert. Present → can **resume** Stripe onboarding. |
| `onboarding_status` | Drives resume vs in-progress messaging; with sync, stays aligned with Stripe.                                  |
| `charges_enabled`   | Must be **true** (with `onboarding_status === 'complete'`) for “Connect done”.                                 |

### 3) ServiceLink checkout — `payment_settings` (optional until enable)

| Column / fact      | Use                                                                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Row **missing**    | After Connect is ready, web shows **gate** (“turn on payments”) — no checkout/deposit cards yet.                                            |
| `payments_enabled` | **true** → booking checkout can be active; **false** → owner may still edit settings but UI de-emphasizes live checkout (web dims section). |

---

## UI state machine (match `PaymentsPage` + dashboard server)

Evaluate in **this order** (same branching as `PaymentsPage.tsx`):

### Step 0 — Preconditions (web dashboard page)

Web also requires **onboarding completed** and a **business** before showing Payments at all (`getOnboardingState` in `dashboard/payments/page.tsx`). Mobile should apply the same product rules before showing this flow.

### Step 1 — Not Pro (`!hasProAccess`)

Show **upgrade / free** experience: no Connect onboarding, no ServiceLink gate — same as web **`FreePaymentPreview`** with upsell (“Connect payments” is a Pro feature).

### Step 2 — Pro but Connect not “ready” (`hasProAccess && !stripeConnectReady`)

**`stripeConnectReady`** (exact web formula):

```text
stripeConnectReady =
  payment_accounts.onboarding_status === 'complete'
  AND payment_accounts.charges_enabled === true
```

Show **Stripe Connect setup** (`ProPaymentsSetupExperience`):

| Situation                                                                              | Suggested UX                                                                                                                            |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| No row or no `stripe_account_id`                                                       | Primary CTA: start Connect (first time).                                                                                                |
| `stripe_account_id` present and (`onboarding_status` is `in_progress` or `restricted`) | **Resume** CTA — user started Stripe but did not finish or account needs attention. Same **`POST …/onboard`** mints a new Account Link. |

User **must** land back on your **payments** surface after Stripe, run **sync**, refetch row, then re-evaluate this tree — otherwise they still look “not ready” until `charges_enabled` / status update.

### Step 3 — Pro and Connect ready, no `payment_settings` row yet

`stripeConnectReady === true` and server would pass **`paymentSettings == null`** when there is **no** `payment_settings` row **and** `payments_enabled` is not true (first time after Connect completes).

Show **ServiceLink gate** (`ProServicelinkPaymentsGate`): success copy + CTA to **`POST /api/payments/servicelink/enable`**. Until that succeeds, **do not** show full deposit / checkout-mode cards as the primary flow (web shows a locked preview below the gate).

### Step 4 — Pro, Connect ready, settings loaded

`stripeConnectReady && paymentSettings != null` (web sets this when Connect is ready **and** (`payments_enabled` **or** a `payment_settings` row exists) so returning users with settings always get the dashboard).

Show **full payments dashboard**: accept-payments toggle card, Express dashboard link section, checkout mode + deposits (web may dim settings when `payments_enabled` is false but still shows editors).

---

## Summary table (quick reference)

| `hasProAccess` | `stripeConnectReady` | `payment_settings`                | Screen (web component)            |
| -------------- | -------------------- | --------------------------------- | --------------------------------- |
| false          | \*                   | \*                                | Free / upgrade                    |
| true           | false                | \*                                | Connect setup (new or **resume**) |
| true           | true                 | none / off until enable           | **Turn on payments** gate         |
| true           | true                 | row present (web loads dashboard) | Full settings + toggle            |

---

## Client flow (recommended)

1. `POST …/onboard` with `{ "client": "mobile" }` → open `url`.
2. User completes or leaves Stripe; Stripe redirects to **`return_url`** or **`refresh_url`** (your deep links).
3. On either deep link, call **`POST …/sync`** with the same Bearer token (and call **onboard** again from **`refresh_url`** if the link expired and you need a new URL).
4. Navigate to your **payments home** (or equivalent) and **refetch** `profiles`, `payment_accounts`, `payment_settings`.
5. Run the **UI state machine** above; if you land in the gate state, call **`POST …/servicelink/enable`** once the user confirms (after Bearer support or authenticated WebView).
6. Refetch again after enable; you should now match **Step 4**.

Web reference: `dashboard/payments/page.tsx` runs sync when `?connect=return|refresh`, then redirects to `/dashboard/payments` without query so the tree re-runs with fresh DB reads.

---

## Error responses (onboard + sync)

| HTTP  | Typical meaning                                         |
| ----- | ------------------------------------------------------- |
| `401` | Invalid or missing Bearer token (or no web session).    |
| `403` | Not Pro — Connect onboarding is Pro-only.               |
| `404` | No business profile for the user.                       |
| `500` | Stripe misconfiguration, Stripe API error, or DB error. |

**Onboard — mobile misconfiguration:**

| HTTP  | Meaning                                                                                                                            |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `500` | `client: "mobile"` but `STRIPE_MOBILE_CONNECT_ONBOARDING_RETURN_URL` or `STRIPE_MOBILE_CONNECT_ONBOARDING_REFRESH_URL` is missing. |

---

## Environment (this repo)

Always required for Connect routes:

- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Bearer validation)

Required when onboard body includes **`client: "mobile"`**:

| Variable                                       | Role                                                                                                                         |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `STRIPE_MOBILE_CONNECT_ONBOARDING_RETURN_URL`  | Stripe Account Link **`return_url`**.                                                                                        |
| `STRIPE_MOBILE_CONNECT_ONBOARDING_REFRESH_URL` | Stripe Account Link **`refresh_url`**.                                                                                       |
| `STRIPE_MOBILE_CONNECT_DEEP_LINK_RETURN_URL`   | Optional deep link opened by the bridge page after return. Default: `servicelinkmobile://payments/connect?connect=return`.   |
| `STRIPE_MOBILE_CONNECT_DEEP_LINK_REFRESH_URL`  | Optional deep link opened by the bridge page after refresh. Default: `servicelinkmobile://payments/connect?connect=refresh`. |

**Important:** Stripe **rejects** `return_url` / `refresh_url` that are not normal **`http:` or `https:`** URLs (error `url_invalid`). Custom app schemes like `servicelink://…` will fail. Use:

- **Production:** set the Stripe env vars to the included bridge routes (or your equivalent):
  - `https://<your-domain>/mobile-bridge/connect-return`
  - `https://<your-domain>/mobile-bridge/connect-refresh`
- Those routes then attempt the app deep link and show fallback actions if app open fails.
- **Local dev:** `http://localhost:…` is fine if Stripe can reach it for testing (often you still use an **https** tunnel or the same bridge pattern as Checkout).

The API validates env URLs before calling Stripe and returns a clear JSON error if the scheme is wrong or the value is not a parseable absolute URL.

Restart Next after editing `.env.local`.

---

## Logs

Server logs use prefixes:

- **`[stripe:connect-onboard]`** for account link creation/auth/config errors.
- **`[stripe:connect-sync]`** for post-return sync calls.
- **`[mobile-connect-bridge]`** when Stripe hits return/refresh bridge routes (useful to confirm Stripe reached your URL during local tunnel/prod testing).
