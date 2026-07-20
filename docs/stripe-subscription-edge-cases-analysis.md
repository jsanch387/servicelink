# Stripe Subscription Management - Edge Cases Analysis

**Date:** 2026-07-20  
**Issue:** Bug report - duplicate active subscriptions allowed  
**Status:** Duplicate-prevention checks added; **legacy onboarding free trial path has since been decommissioned** (`start-onboarding-trial` removed). Sections that analyze that route are historical.

---

## Executive Summary

### Critical Issues Found 🔴

1. **CRITICAL: Duplicate Subscriptions Allowed**
   - Users can create multiple active subscriptions
   - No validation against existing active subscriptions in Stripe
   - Results in double-billing and confusion

2. **CRITICAL: Database-Only Validation**
   - Both subscription creation routes trust `profiles.stripe_subscription_id`
   - Never queries Stripe for actual active subscriptions
   - Stale/wrong DB data allows duplicate creation

3. **HIGH: Silent Fallthrough on Errors**
   - `create-checkout-session` falls through to create new subscription on retrieve errors
   - No defensive checks if subscription retrieval fails
   - Could create duplicates if DB has wrong subscription ID

### Architecture Overview

Your subscription system has:

- **2 creation entry points** (onboarding trial + checkout)
- **4 webhook handlers** (created, updated, deleted, payment_failed)
- **3 database sync functions**
- **Legacy $10 pricing + new $20 pricing** (grandfathered correctly)
- **Monthly + Yearly billing** (properly implemented)

---

## Detailed Analysis by Flow

### 1. CRITICAL BUG: Duplicate Subscription Creation

#### **Affected Routes**

##### A) `/api/stripe/start-onboarding-trial` (Line 128-244)

**Current Logic:**

```typescript
// Lines 128-131: Only checks DB subscription status
if (
  stripeSubId &&
  subStatus &&
  STRIPE_SUBSCRIPTION_STATUSES_GRANTING_PRO.has(subStatus)
) {
  return early; // Already active
}

// Lines 240-244: Creates subscription without checking Stripe
subscription = await stripe.subscriptions.create(subscriptionParams);
```

**Problem:**

- Only checks `profiles.stripe_subscription_id` and `subscription_status` from DB
- Never calls `stripe.subscriptions.list()` to verify customer has no active subs
- If DB is stale/wrong, creates duplicate subscription

**Exploit Scenario:**

1. User has `sub_OLD` active at $10/month
2. DB somehow has wrong/null `stripe_subscription_id` (data corruption, race condition)
3. User clicks "Activate trial" → creates `sub_NEW` at $20/month
4. User now has 2 active subscriptions, charged twice monthly

##### B) `/api/stripe/create-checkout-session` (Line 143-260)

**Current Logic:**

```typescript
// Lines 143-154: Only checks DB subscription ID
if (existingStripeSubscriptionId) {
  const existingSub = await stripe.subscriptions.retrieve(
    existingStripeSubscriptionId
  );
  // ... resume logic or error
}

// Lines 231-260: Falls through to create NEW subscription
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  // Creates NEW subscription in Stripe
});
```

**Problems:**

1. **Only checks one subscription ID** from DB (`profiles.stripe_subscription_id`)
2. **Never lists customer's subscriptions** to find other active subs
3. **Silent fallthrough** - if retrieve fails (deleted sub, wrong ID), creates new sub
4. **No final validation** before creating checkout session

**Exploit Scenario:**

1. User has `sub_ACTIVE` at $10/month in Stripe
2. `profiles.stripe_subscription_id` points to old deleted `sub_OLD` (webhook lag)
3. `stripe.subscriptions.retrieve(sub_OLD)` throws error
4. Caught by `catch` at line 218, logs warning
5. Falls through to line 231 → creates NEW checkout session
6. User completes payment → `sub_NEW` created
7. User now has `sub_ACTIVE` + `sub_NEW` both charging

---

### 2. Webhook Handlers - Status Assessment ✅

#### **checkout.session.completed** (Line 363-999)

**Status:** ✅ GOOD

- Idempotency enforced via `stripe_webhook_events` table
- Calls `updateProfileFromCheckout()` which overwrites `stripe_subscription_id`
- **Edge Case Handled:** If user completes checkout for 2nd subscription:
  - Webhook fires twice (2 different session IDs)
  - Both events process (different `event_id`)
  - **PROBLEM:** Both subscriptions activate, last one wins in DB
  - **Result:** User charged for both, DB only shows last one

**Potential Issue:**

- If 2 checkouts complete nearly simultaneously, webhooks race
- Last webhook wins, DB shows only 1 subscription
- User still charged for both subscriptions monthly
- User sees only 1 subscription in Settings but charged for 2

#### **customer.subscription.updated** (Line 1002-1091)

**Status:** ✅ MOSTLY GOOD

- Updates status on renewal, past_due, unpaid correctly
- Retrieves fresh subscription from Stripe (authoritative)
- Syncs billing interval properly
- **Edge Case:** What if user has 2 subscriptions?
  - Webhook fires for EACH subscription independently
  - `syncProfileFromSubscriptionUpdated()` finds profile by `stripe_subscription_id`
  - Only updates profile for matching subscription ID
  - **PROBLEM:** If user has 2 subs, only 1 tracked in DB at a time
  - Other subscription still charges but not visible in app

#### **customer.subscription.deleted** (Line 1094-1138)

**Status:** ✅ GOOD

- Properly downgrades to free
- Keeps `stripe_customer_id` for resubscribe (correct)
- Clears `stripe_subscription_id` properly
- **Edge Case:** If user has 2 subscriptions and cancels 1:
  - Webhook fires for cancelled subscription
  - If DB has that subscription ID → clears it, sets free
  - **PROBLEM:** User still has OTHER active subscription charging
  - DB shows free, user still charged monthly by other sub

#### **invoice.payment_failed** (Line 1141-1221)

**Status:** ✅ GOOD

- Retrieves fresh subscription status from Stripe
- Syncs to DB correctly
- One-time email notification properly guarded
- **No issues identified**

---

### 3. Database Sync Functions - Status Assessment

#### **updateProfileFromCheckout()** ✅

**Status:** GOOD

- Overwrites subscription fields (idempotent)
- Resets `payment_failed_email_sent_at` correctly
- Handles billing interval properly
- **Issue:** Doesn't check if DIFFERENT subscription exists before overwriting

#### **syncProfileFromSubscriptionUpdated()** ✅

**Status:** GOOD

- Finds profile by subscription ID correctly
- Updates tier based on status correctly
- Handles cancel_at_period_end flag
- **Issue:** Only syncs ONE subscription - if user has 2, only 1 tracked

#### **downgradeProfileFromSubscriptionEnd()** ✅

**Status:** GOOD

- Clears subscription fields properly
- Keeps customer ID for resubscribe
- **Issue:** If user has 2 subs, deleting 1 shouldn't downgrade to free

---

### 4. Legacy Pricing ($10 → $20) - Status Assessment ✅

**Status:** ✅ EXCELLENT IMPLEMENTATION

Your grandfathering logic is **perfect**:

- Old subscriptions stay on `price_OLD` at $10/month automatically
- New subscriptions use `STRIPE_PRO_PRICE_ID` at $20/month
- No forced migrations (correct approach)
- Settings page shows actual price from Stripe via `getSubscriptionMonthlyPriceDisplay()`
- Resubscribe after cancel → new price (expected behavior)

**No issues identified** with pricing grandfathering.

---

### 5. Billing Interval (Monthly/Yearly) - Status Assessment ✅

**Status:** ✅ WELL IMPLEMENTED

- `STRIPE_PRO_PRICE_ID` for monthly ($20/mo)
- `STRIPE_PRO_YEARLY_PRICE_ID` for yearly ($200/yr)
- Webhooks sync `subscription_billing_interval` correctly
- UI toggle works properly
- Both use same Product (correct Stripe pattern)

**No issues identified** with billing intervals.

---

### 6. Payment Failure Handling - Status Assessment ✅

**Status:** ✅ GOOD

- `invoice.payment_failed` webhook retrieves fresh status
- Syncs `past_due`/`unpaid` status to DB correctly
- One-time email via `notifyPaymentFailedOnce()` with atomic claim
- Flag clears on recovery (proper reset)
- In-app banner shows when `past_due`/`unpaid`

**No issues identified** with payment failure handling.

---

### 7. Subscription Cancellation - Status Assessment ⚠️

**Status:** ⚠️ MINOR ISSUE

**Current Flow:**

1. User clicks "Manage subscription" → Customer Portal
2. User cancels → Stripe sets `cancel_at_period_end: true`
3. `customer.subscription.updated` webhook fires
4. Subscription stays `active` until period ends
5. At period end → `customer.subscription.deleted` fires
6. Profile downgraded to free

**Issue:** Multi-subscription scenario:

- If user has 2 active subscriptions and cancels 1 via Portal:
  - Portal only shows/cancels the subscription linked to that customer
  - **PROBLEM:** Portal might not show all subscriptions if they're on different prices
  - User might not realize they have 2 subscriptions
  - Cancelling 1 doesn't affect the other

**Fix:** Prevent duplicates (main bug fix)

---

### 8. Resubscribe Flow - Status Assessment ✅

**Status:** ✅ GOOD

- Keeps `stripe_customer_id` after cancellation (correct)
- Resubscribe creates new subscription on same customer
- New subscription uses current price ($20 if they had $10)
- Webhook overwrites `stripe_subscription_id` with new value

**No issues identified** - resubscribe works correctly.

---

### 9. One Customer Per Profile - Status Assessment ✅

**Status:** ✅ EXCELLENT

- `create-checkout-session` reuses `stripe_customer_id` when present
- Only creates new customer if none exists
- Prevents duplicate customers in Stripe Dashboard
- Well-documented in README

**No issues identified** - customer management is excellent.

---

### 10. Trial Handling - Status Assessment ⚠️

**Status:** ⚠️ MINOR ISSUE

**Trial Logic:**

- `start-onboarding-trial` applies 7-day trial only if NO prior `stripe_customer_id`
- `create-checkout-session` applies 7-day trial only if from onboarding AND no prior customer
- Trial uses `trial_period_days: 7` with `missing_payment_method: cancel`

**Issue:**

- Trial eligibility based on `profiles.stripe_customer_id` existence
- If user previously had subscription → cancelled → resubscribes:
  - Has `stripe_customer_id` → no trial (correct, intentional)
- **Edge Case:** If duplicate subscriptions exist:
  - User might get trial on 2nd subscription creation if DB state is wrong

**Fix:** Prevent duplicates (main bug fix)

---

## Risk Matrix

| Issue                             | Severity    | Likelihood | Impact           | Current State |
| --------------------------------- | ----------- | ---------- | ---------------- | ------------- |
| Duplicate subscriptions allowed   | 🔴 CRITICAL | Medium     | Double billing   | UNFIXED       |
| DB-only validation (not Stripe)   | 🔴 CRITICAL | High       | Data drift       | UNFIXED       |
| Silent fallthrough on errors      | 🟡 HIGH     | Low        | Silent failures  | UNFIXED       |
| Multi-sub webhook racing          | 🟡 HIGH     | Low        | DB inconsistency | UNFIXED       |
| Cancel only shows 1 sub in Portal | 🟠 MEDIUM   | Low        | Confusing UX     | INHERENT      |
| Trial on duplicate sub            | 🟢 LOW      | Very Low   | Free trial abuse | UNFIXED       |

---

## Recommended Fixes

### Fix 1: Add Active Subscription Check ⭐ CRITICAL

**Create helper function:**

```typescript
// src/features/pricing/server/checkActiveSubscriptions.ts
export async function checkActiveSubscriptions(
  stripe: Stripe,
  customerId: string
): Promise<{
  hasActive: boolean;
  activeSubscriptions: Stripe.Subscription[];
}> {
  const activeList = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 10,
  });

  const trialingList = await stripe.subscriptions.list({
    customer: customerId,
    status: 'trialing',
    limit: 10,
  });

  const allActive = [...activeList.data, ...trialingList.data];

  return {
    hasActive: allActive.length > 0,
    activeSubscriptions: allActive,
  };
}
```

**Use in both routes BEFORE subscription creation:**

```typescript
// Before creating subscription or checkout
const { hasActive, activeSubscriptions } = await checkActiveSubscriptions(
  stripe,
  stripeCustomerId
);

if (hasActive) {
  console.warn('[stripe] Blocked duplicate subscription attempt', {
    userId: user.id,
    customerId: stripeCustomerId,
    existingSubIds: activeSubscriptions.map(s => s.id),
  });

  return NextResponse.json(
    {
      success: false,
      error:
        'You already have an active subscription. Please cancel it in Settings before creating a new one, or contact support.',
      code: 'DUPLICATE_SUBSCRIPTION_BLOCKED',
    },
    { status: 400 }
  );
}
```

### Fix 2: Cancel-and-Replace Option (Alternative)

**If you want to allow plan changes:**

```typescript
if (hasActive) {
  // Cancel all existing subscriptions first
  for (const sub of activeSubscriptions) {
    await stripe.subscriptions.cancel(sub.id);
    console.info('[stripe] Auto-cancelled existing subscription', {
      oldSubId: sub.id,
      reason: 'plan_change',
    });
  }
  // Then proceed to create new subscription
}
```

⚠️ **Risk:** If new subscription creation fails after cancellation, user loses access

### Fix 3: Defensive Error Handling

**In create-checkout-session:**

```typescript
if (existingStripeSubscriptionId) {
  try {
    const existingSub = await stripe.subscriptions.retrieve(
      existingStripeSubscriptionId
    );
    // ... resume logic
  } catch (resumeErr) {
    console.warn('[stripe] subscription retrieve failed', resumeErr);

    // BEFORE falling through, check for ANY active subscriptions
    const { hasActive } = await checkActiveSubscriptions(
      stripe,
      existingStripeCustomerId
    );
    if (hasActive) {
      return NextResponse.json(
        {
          success: false,
          error:
            'You have an active subscription. Please manage it in Settings.',
        },
        { status: 400 }
      );
    }
    // Only now fall through to create new subscription
  }
}
```

### Fix 4: Add Monitoring & Alerts

**Add daily check for multi-subscription users:**

```sql
-- Run daily to detect duplicate subscriptions
SELECT
  p.user_id,
  p.stripe_customer_id,
  p.stripe_subscription_id,
  p.subscription_status
FROM profiles p
WHERE p.stripe_customer_id IS NOT NULL
  AND p.stripe_subscription_id IS NOT NULL;

-- Then use Stripe API to list subscriptions for each customer
-- Alert if customer has >1 active/trialing subscription
```

### Fix 5: Webhook Safety for Multi-Subs

**Update webhook handlers to detect multi-subs:**

```typescript
// In checkout.session.completed webhook
const subscription = session.subscription as string;

// Check if customer has OTHER active subscriptions
const { activeSubscriptions } = await checkActiveSubscriptions(
  stripe,
  stripeCustomerId
);

if (activeSubscriptions.length > 1) {
  console.error(
    '[stripe:webhook] ALERT: Customer has multiple active subscriptions',
    {
      customerId: stripeCustomerId,
      subscriptionIds: activeSubscriptions.map(s => s.id),
      eventId: event.id,
    }
  );

  // Send alert to ops team
  // Consider auto-cancelling older subscriptions
}
```

---

## Testing Checklist

### Pre-Deploy Testing

- [ ] User with no subscription → creates new subscription ✅
- [ ] User with active subscription → blocked from creating 2nd ✅
- [ ] User with cancelled subscription → can resubscribe ✅
- [ ] User with past_due subscription → can pay via portal ✅
- [ ] User cancels subscription → stays active until period end ✅
- [ ] Webhook handles renewal correctly ✅
- [ ] Webhook handles payment failure correctly ✅
- [ ] Legacy $10 users keep $10 price ✅
- [ ] New users pay $20 ✅
- [ ] Monthly/yearly billing both work ✅

### Edge Case Testing

- [ ] DB has wrong subscription_id → still blocked from duplicate
- [ ] DB has null subscription_id but Stripe has active → blocked
- [ ] User attempts 2 simultaneous checkouts → only 1 succeeds
- [ ] Webhook race condition → last webhook wins, no duplicates created
- [ ] Subscription retrieve fails → still checks for active subs

---

## Migration Plan

### Phase 1: Audit (Before Deploy)

1. Query production DB for all users with `stripe_customer_id`
2. Use Stripe API to list subscriptions for each customer
3. Identify any users with multiple active subscriptions
4. Manually cancel duplicate subscriptions (keep oldest)
5. Document affected users for refunds

### Phase 2: Deploy Fix

1. Deploy helper function `checkActiveSubscriptions()`
2. Deploy updated `start-onboarding-trial` route
3. Deploy updated `create-checkout-session` route
4. Deploy webhook monitoring (optional)

### Phase 3: Monitor (Post-Deploy)

1. Set up daily check for multi-subscription users
2. Monitor error logs for `DUPLICATE_SUBSCRIPTION_BLOCKED`
3. Track if legitimate users are being blocked (false positives)
4. Adjust error messages based on support tickets

---

## Summary

### What's Working Well ✅

- Webhook idempotency
- Payment failure handling
- Legacy pricing grandfathering
- Billing interval handling
- One customer per profile
- Resubscribe flow
- Cancellation flow

### What Needs Fixing 🔴

1. **Duplicate subscription prevention** (CRITICAL)
2. **Stripe-based validation** instead of DB-only (CRITICAL)
3. **Defensive error handling** (HIGH)
4. **Multi-subscription monitoring** (MEDIUM)

### Overall Architecture Rating: B+

Your subscription system is **well-architected** with good webhook handling, proper idempotency, and excellent grandfathering logic. The main gap is **lack of active subscription validation** before creation, which is a common oversight but critical to fix.

**Estimated Fix Time:** 2-4 hours for implementation + testing
**Risk Level:** Low (defensive checks, no breaking changes)
**User Impact:** Prevents double-billing, improves reliability

---

**Next Steps:**

1. ✅ Create bug fix branch
2. ⏳ Implement Fix 1 (active subscription check)
3. ⏳ Implement Fix 3 (defensive error handling)
4. ⏳ Add logging and monitoring
5. ⏳ Test all edge cases
6. ⏳ Deploy to production
7. ⏳ Run Phase 1 audit for existing duplicates
