# `/api/account`

Authenticated endpoints for the current user's ServiceLink account.

| Method   | Purpose                                      |
| -------- | -------------------------------------------- |
| `DELETE` | Permanently delete the account               |
| `PATCH`  | Request an email change (confirmation email) |

The same endpoint is used by the Expo mobile app (Bearer auth) and the web Settings page (cookie auth). One implementation, two transports — see [`src/libs/api/getAuthenticatedUser.ts`](../../../libs/api/getAuthenticatedUser.ts).

---

## Recommended testing order (do this before shipping mobile)

**Phase 1 — Web app locally (validate backend + DB + Stripe before Expo)**

1. Run Next locally (`npm run dev` on `http://localhost:3000` is enough for web-only).
2. Sign in as a **throwaway** test user (you will delete this account).
3. Open **`/dashboard/settings`** (onboarding must be complete).
4. Scroll to **Delete account** → confirm modal opens.
5. Type the **exact account email** → **Delete account**.
6. Expected:
   - Terminal / logs show `[account-delete]` lines (`start` → Stripe steps in service → `success`).
   - HTTP **200** with `{ success: true, warnings?: [...] }`.
   - Browser redirects to **`/`** and you are **logged out** (session invalid).
7. Verify in **Supabase Dashboard → Authentication → Users**: that user id is **gone**.
8. Spot-check **public** tables (optional): `profiles`, `business_profiles` for that user should be gone via cascades.

**Phase 2 — Mobile (Expo)** — only after Phase 1 passes. Use the **Mobile app (Expo) implementation prompt** below.

---

## `PATCH /api/account` — request email change

Starts an email change for the authenticated user via Supabase `auth.updateUser({ email })`. With **Secure email change** disabled in the Supabase project, only the **new** address must confirm; the address updates after that link is clicked.

### Auth

Same as delete: Bearer token (mobile) or cookie session (web).

### Request body

```json
{ "newEmail": "new@example.com" }
```

### Responses

| Status | `code`           | Meaning                                                |
| ------ | ---------------- | ------------------------------------------------------ |
| 200    | —                | Confirmation email sent. Body includes `pendingEmail`. |
| 400    | `INVALID_BODY`   | Missing/invalid JSON or `newEmail`.                    |
| 400    | `INVALID_EMAIL`  | `newEmail` failed validation.                          |
| 400    | `SAME_EMAIL`     | New email matches the current one.                     |
| 400    | `EMAIL_IN_USE`   | Another account already uses that email.               |
| 400    | `UPDATE_FAILED`  | Supabase rejected the update (message in `error`).     |
| 401    | `UNAUTHORIZED`   | Missing/invalid session.                               |
| 429    | `RATE_LIMITED`   | 1 request / 60s per user and per IP.                   |
| 500    | `INTERNAL_ERROR` | Unhandled server error.                                |

After the user clicks the confirmation link, auth callback sends them to `/dashboard/settings?email_notice=updated` (or `email_notice=error` if confirmation fails).

### Local testing (important)

Confirmation emails use your **Supabase project** (often shared with production). If the `redirect_to` in the email link is `https://myservicelink.app` instead of `http://localhost:3000/auth/callback?...`, Supabase rejected the local URL and fell back to **Site URL**.

1. Supabase Dashboard → **Authentication** → **URL Configuration**
2. Under **Redirect URLs**, add:
   - `http://localhost:3000/**`
   - `http://127.0.0.1:3000/**`
3. Keep Site URL as production (`https://myservicelink.app`) if you want.
4. Request a **new** confirmation email from local Settings (wait ~60s if rate-limited).
5. In the email link, confirm `redirect_to=` starts with `http://localhost:3000/auth/callback`.
6. Click the link in the **same browser** you used for local login (PKCE).

If a failed attempt already created a **second** auth user with the target email, delete that user in **Authentication → Users** before retrying, or you will get `EMAIL_IN_USE`.

---

## `DELETE /api/account` — delete the current user's account

Permanently deletes the authenticated user. Cancels any active Stripe subscription immediately, removes the Stripe customer (PII), drops the local `payment_accounts` row, then deletes the Supabase auth user. Database FK cascades clean profile, business, and dependent rows.

### Auth

Send **one** of:

- `Authorization: Bearer <supabase access token>` — mobile / SDK clients.
- Supabase auth cookies — used automatically by the web Settings page.

The route validates the session and only deletes that user's account. The body cannot specify a different user id.

### Request body

```json
{ "confirmEmail": "user@example.com" }
```

`confirmEmail` must equal the authenticated user's email (case-insensitive, trimmed). Any other value returns `400 CONFIRM_EMAIL_MISMATCH` with no destructive side effects.

### Responses

| Status | `code`                   | Meaning                                                                 |
| ------ | ------------------------ | ----------------------------------------------------------------------- |
| 200    | —                        | Account deleted. Body: `{ success: true, warnings: string[] }`.         |
| 400    | `INVALID_BODY`           | Body was not JSON, or `confirmEmail` was missing.                       |
| 400    | `CONFIRM_EMAIL_MISMATCH` | Confirmation email did not match the authenticated user's email.        |
| 401    | `UNAUTHORIZED`           | Missing/invalid bearer token, or no Supabase auth cookie.               |
| 429    | `RATE_LIMITED`           | Rate-limited (10s sliding window, per user and per IP).                 |
| 502    | `STRIPE_ERROR`           | Stripe subscription cancel failed; no auth deletion happened. Retry.    |
| 500    | `AUTH_DELETE_FAILED`     | Stripe was reconciled but `auth.admin.deleteUser` failed — contact ops. |
| 500    | `INTERNAL_ERROR`         | Unhandled server error.                                                 |

Error body shape: `{ success: false, code: string, error: string }`.

### Client behavior on success

The user's session is invalid as soon as the auth row is gone. The client should:

1. Call the existing local sign-out to clear tokens / Zustand state.
2. Clear any persisted local storage tied to the previous user.
3. Navigate to a logged-out route (e.g. `/`).

The web `DeleteAccountSection` already does this — see [`src/features/account/components/DeleteAccountSection.tsx`](../../../features/account/components/DeleteAccountSection.tsx).

---

## What gets deleted

Each step is logged with structured context (no PII beyond user id) under `[account-delete]`:

1. **Stripe subscription** — `stripe.subscriptions.cancel(...)` (immediate cancel, not at period end). If Stripe returns `resource_missing` we treat it as already-gone and continue. Any other error is fail-stop.
2. **Stripe customer** — `stripe.customers.del(...)` to purge customer-side PII (email/name/payment method). Best-effort: if the customer is missing or the API key is in the wrong mode (test vs live — see [`src/app/api/stripe/README.md`](../stripe/README.md)) we log and continue. Stripe retains historical invoices/charges for tax/audit; that's expected.
3. **`payment_accounts` row** — deleted via the admin client. The Stripe Connect account itself is **not** rejected/deleted: Stripe disallows that for connected accounts that have processed payments, so we simply stop referencing it. The orphaned `acct_…` is logged for ops.
4. **Supabase auth user** — `admin.auth.admin.deleteUser(userId)`. FK cascades from `auth.users` / `public.profiles` clean the rest.

Stripe's subsequent `customer.subscription.deleted` webhook will fire after step 1. The existing handler in [`src/app/api/stripe/webhook/route.ts`](../stripe/webhook/route.ts) is idempotent and treats "no matching profile" as success, so this is safe.

---

## Mobile app (Expo) — implementation prompt (paste into mobile backlog)

Use this spec when wiring **account deletion** in ServiceLink mobile **after** web Phase 1 passes.

**Goal**

From Settings (or equivalent), user taps **Delete account**, confirms by typing their **account email** (must match `session.user.email`), then the server deletes the account permanently. On success the app **signs out** and clears local auth state.

**Environment**

- `EXPO_PUBLIC_API_BASE_URL` — origin only, **no** trailing slash. Examples:
  - Production: `https://myservicelink.app` (or your deployed Next URL).
  - Local iOS Simulator: `http://localhost:3000`.
  - Local Android emulator: `http://10.0.2.2:3000`.
  - Physical device: `http://<machine-LAN-IP>:3000` and run Next with `-H 0.0.0.0` if needed.

**Supabase**

- Same Supabase **project** as the Next app (`NEXT_PUBLIC_SUPABASE_URL` + anon key alignment).
- Do **not** embed service role or Stripe secrets in the app.

**HTTP**

- **Method:** `DELETE`
- **URL:** `{EXPO_PUBLIC_API_BASE_URL}/api/account`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <access_token>` where `<access_token>` is from `const { data: { session } } = await supabase.auth.getSession()` → **`session.access_token`** (JWT — do **not** send refresh token).
- **Body:** `{ "confirmEmail": "<string>" }` — normalized UX: trim input; server compares case-insensitively.

**Responses**

- Parse JSON. Success: `200`, `success === true`. Errors: use `code` + `error` for user-visible messages (`CONFIRM_EMAIL_MISMATCH`, `UNAUTHORIZED`, `RATE_LIMITED`, `STRIPE_ERROR`, etc.).
- On **`401`** after a prior success, treat as signed-out anyway and clear local session.

**Client flow after `200`**

1. `await supabase.auth.signOut()` (and clear SecureStore / AsyncStorage keys your app uses for auth).
2. Navigate to logged-out stack / login screen.
3. Do **not** retry deletion with the same token (it is invalid).

**Testing**

- Match **Phase 1 web** first; then repeat against local Next + Simulator using table below.

---

## Local testing from the Expo simulator

The Next.js dev server and the Expo simulator must talk over the **same** Supabase project as above.

### 1. Run Next on your LAN (mobile device / Android emulator)

```bash
npm run dev -- --hostname 0.0.0.0 --port 3000
```

`-H 0.0.0.0` / `--hostname 0.0.0.0` lets non-localhost clients reach your Mac.

### 2. Use the right host from the client

| Client                     | API base URL                                    |
| -------------------------- | ----------------------------------------------- |
| iOS Simulator              | `http://localhost:3000`                         |
| Android emulator           | `http://10.0.2.2:3000`                          |
| Physical device on Wi-Fi   | `http://<your-mac-lan-ip>:3000` (firewall open) |
| Web (this Next app itself) | _no base needed; relative `/api/account`_       |

### 3. Reference fetch (Expo)

```ts
const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/account`, {
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  },
  body: JSON.stringify({ confirmEmail }),
});

const data = await res.json();
if (res.ok && data.success) {
  await supabase.auth.signOut();
  // navigate to logged-out screen
}
```

### 4. Stripe test mode

`STRIPE_SECRET_KEY` in `.env.local` is typically `sk_test_...`. Use a profile whose `stripe_customer_id` and `stripe_subscription_id` were created in test mode (e.g. via a test-mode checkout). If your local profile still holds **live** Stripe IDs, the cancel call will return "No such subscription" — this is a known gotcha (see [`src/app/api/stripe/README.md`](../stripe/README.md)). Recreate the test-mode subscription locally before exercising the flow.

### 5. CORS

Native fetch from Expo isn't subject to browser CORS, so this works as-is from the Simulator and on devices. We don't add a permissive CORS layer to the Next route.

---

## Rate limiting behavior

- Uses `@upstash/ratelimit` when `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set.
- Falls back to in-process sliding-memory limiting in local/dev if Upstash env vars are missing.
- Two checks are applied to `DELETE /api/account`:
  - `1 request / 10 seconds` per authenticated user id.
  - `1 request / 10 seconds` per client IP.
