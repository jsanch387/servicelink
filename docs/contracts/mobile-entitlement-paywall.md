# Mobile: profile fields for access vs paywall (web parity)

**Product context (plans, trials, paywall strategy):** [`../pricing-strategy-and-model.md`](../pricing-strategy-and-model.md) · **[`../subscription-and-pro-features.md`](../subscription-and-pro-features.md)**

Mobile should mirror the same rules as the Next.js web app. **Canonical logic** lives in:

- `src/features/pricing/utils/isProAccess.ts` — function `isProAccess` (+ `hasStripeBillingHistory`)
- `src/middleware.ts` — dashboard paywall redirect (uses the same fields)

There is **no** `requires_upgrade` (or similar) column. Entitlement is **derived** from `profiles` fields below.

---

## 1. Columns to read from `profiles` (by `user_id`)

| Column | Required for gating | Role |
|--------|----------------------|------|
| `onboarding_status` | **Yes** | Web blocks dashboard navigation until `completed` (except onboarding flow). |
| `subscription_tier` | **Yes** | Must be `'pro'` for any Pro entitlement path. |
| `subscription_status` | **Yes** (when billed) | Stripe subscription status string; drives access for users with a `stripe_subscription_id`. |
| `stripe_subscription_id` | **Yes** | If set, user is on the **billed** path; status rules apply. If empty, user may be **manual / comped Pro** (no Stripe). |
| `stripe_customer_id` | **Yes** | Used with `stripe_subscription_id` to detect **manual Pro** vs **former Stripe customer** edge case. |
| `subscription_current_period_end` | **No** (access) | **Not** used to grant or revoke Pro for billed users in `isProAccess`. Use for **UI copy** only (“renews”, “trial ends”, “access until”). |
| `subscription_cancel_at_period_end` | **No** (access) | Web uses this in Settings UI; **middleware paywall does not read it**. Access while cancel is pending comes from Stripe still sending `active` (or empty status grace). |

---

## 2. Effective Pro access — `isProAccess` (same inputs as web)

Call the conceptual check with:

```text
isProAccess(
  subscription_tier,
  subscription_current_period_end,  // ignored for billed access; keep for API parity
  subscription_status,
  stripe_subscription_id,
  stripe_customer_id
)
```

### Step A — Not Pro tier

- If `subscription_tier !== 'pro'` → **no Pro access**.

### Step B — Manual / comped Pro (no Stripe subscription)

When `stripe_subscription_id` is **null/empty**:

- If `stripe_customer_id` is **non-empty** → **no Pro access**  
  (Guards against stale `subscription_tier = 'pro'` after someone had Stripe; web treats this as *not* manual comped Pro.)
- If `stripe_customer_id` is **null/empty** → **Pro access**  
  (Manual Pro you set in the app: Pro with **no** `cus_…` and **no** `sub_…`. `subscription_status` is ignored here.)

### Step C — Billed Pro (Stripe subscription present)

When `stripe_subscription_id` is **non-empty**:

- `subscription_tier` must still be `'pro'` (already enforced in A).
- If `subscription_status` is **null or empty string** → **Pro access**  
  (Intentional short grace for webhook / migration lag.)
- If `subscription_status` is **`active` or `trialing`** → **Pro access**  
  (Includes **free trial**: Stripe status `trialing` + Pro tier.)
- Any **other** non-empty status → **no Pro access**  
  (e.g. `past_due`, `unpaid`, `canceled`, `incomplete`, `incomplete_expired`, …)

**Important:** For billed users, **`subscription_current_period_end` does not grant or revoke access** in this function. “Canceled but still active until period end” is reflected when Stripe still reports **`active`** with cancel-at-period-end; once Stripe moves status, webhooks update `subscription_status` accordingly.

---

## 3. Stripe “billing history” — `hasStripeBillingHistory`

Used on web to decide whether the **subscription paywall** applies after onboarding.

**True** if **any** of these is non-empty (after trim):

- `stripe_customer_id`
- `stripe_subscription_id`
- `subscription_status`

**False** if all three are empty → user is treated like **legacy free** (full app access on web, no subscription paywall), even if `subscription_tier` is `free`.

---

## 4. When to show the paywall (middleware-equivalent)

After the user has finished onboarding:

```text
onboardingComplete = (onboarding_status === 'completed')
hasBillingHistory    = hasStripeBillingHistory(...)
hasAccess            = isProAccess(...)

showPaywall = onboardingComplete && hasBillingHistory && !hasAccess
```

| Scenario | Typical profile signals | Paywall? |
|----------|-------------------------|----------|
| Manual Pro (you set Pro, no Stripe) | `tier=pro`, empty `cus`/`sub` | **No** |
| Free user, never Stripe | empty `cus`/`sub`/status | **No** |
| Pro trial (Stripe) | `tier=pro`, `sub` set, `status=trialing` | **No** |
| Active paid | `tier=pro`, `sub` set, `status=active` | **No** |
| Canceled / unpaid / past_due / … | `tier` may still be `pro` but `status` not in granting set | **Yes** |
| Former subscriber, stale tier | `tier=pro`, `cus` set, `sub` empty | **Yes** (`isProAccess` false) |

Web sends paywalled users to **`/dashboard/upgrade`**. Mobile should show your paywall UI and CTA to **checkout** (same as web upgrade flow).

---

## 5. Onboarding vs main app

Until `onboarding_status === 'completed'`, web keeps users in the **onboarding flow** (not the same as “paywall”, but mobile should gate similarly: finish onboarding before full app).

---

## 6. Web parity reference (for engineers)

| Concern | File / export |
|---------|----------------|
| Pro access boolean | `isProAccess` in `src/features/pricing/utils/isProAccess.ts` |
| “Has Stripe billing history” | `hasStripeBillingHistory` in same file |
| Dashboard redirect to upgrade | `src/middleware.ts` (block when `ownerHasStripeBillingHistory && !isProAccess`) |
| Server-side reuse | `getHasProAccessForPayments` / `ownerHasProAccessForBusiness` also call `isProAccess` with the **same column list** |

---

## 7. Optional display-only fields

Use for labels only; **do not** use these as the sole gate for Pro:

- `subscription_current_period_end`
- `subscription_cancel_at_period_end`

Refetch `profiles` after Stripe webhooks have time to apply (same as web).
