# Subscription E2E Tests

End-to-end tests for subscription management flows, with focus on preventing the duplicate subscription bug.

## Overview

These tests verify:
- ✅ Duplicate subscription prevention (critical bug fix)
- ✅ Subscription upgrade flow
- ✅ Subscription status display
- ✅ API endpoint validation
- ✅ Error handling and user messaging
- ✅ Edge cases (concurrent requests, rapid clicks, etc.)

## Test Files

### `duplicate-prevention.spec.ts`
**Critical bug fix validation tests**

Tests the specific scenarios that caused the duplicate subscription bug:
- Prevents duplicate via upgrade page UI
- Prevents duplicate via API calls
- Prevents duplicate via onboarding trial
- Validates error messages
- Tests defensive scenarios

**Run these first** after deploying the bug fix.

### `subscription-flows.spec.ts`
**General subscription flow tests**

Tests overall subscription functionality:
- Upgrade page navigation
- Settings page display
- API endpoint responses
- Subscription status checks
- Edge case handling

## Prerequisites

### 1. Environment Setup

Create `.env.e2e.local` (copy from `.env.e2e.example`):

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3000
E2E_OWNER_EMAIL=your-test-user@example.com
E2E_OWNER_PASSWORD=TestPassword123
```

### 2. Stripe Test Mode Configuration

Ensure your app is using Stripe **test mode**:

```bash
# .env.local
STRIPE_SECRET_KEY=sk_test_...  # Must be test key
STRIPE_PRO_PRICE_ID=price_...  # Test price ID
STRIPE_WEBHOOK_SECRET=whsec_... # Test webhook secret
```

### 3. Test User Setup

You'll need **TWO test user accounts** for comprehensive testing:

#### User 1: With Active Subscription
- Create account in your app
- Complete test subscription checkout with card `4242 4242 4242 4242`
- Verify subscription is active in Stripe dashboard
- Use for duplicate prevention tests

#### User 2: Without Subscription (Free Tier)
- Create account in your app
- Do NOT complete subscription
- Use for upgrade flow tests

Alternatively, use **one** user and cancel/create subscription between test runs.

## Running Tests

### Run All Subscription Tests
```bash
npm run test:e2e -- e2e/subscriptions/
```

### Run Only Duplicate Prevention Tests (Critical)
```bash
npm run test:e2e -- e2e/subscriptions/duplicate-prevention.spec.ts
```

### Run Only General Flow Tests
```bash
npm run test:e2e -- e2e/subscriptions/subscription-flows.spec.ts
```

### Run Specific Test
```bash
npm run test:e2e -- e2e/subscriptions/duplicate-prevention.spec.ts -g "prevents duplicate subscription"
```

### Debug Mode (Headed Browser)
```bash
npm run test:e2e -- e2e/subscriptions/ --headed --debug
```

## Test Strategy

### Testing with Active Subscription

For tests that require an active subscription:

1. **Setup:** Manually create subscription first
   - Login to test user account
   - Go to `/dashboard/upgrade`
   - Complete checkout with test card `4242 4242 4242 4242`
   - Wait for webhook to process (check `/dashboard/settings`)

2. **Run Test:**
   ```bash
   npm run test:e2e -- duplicate-prevention.spec.ts -g "CRITICAL: Prevents duplicate"
   ```

3. **Verify:**
   - Test should PASS (upgrade blocked)
   - Check Stripe dashboard: still only 1 subscription
   - Check app logs: should see "blocked duplicate" message

### Testing without Subscription

For tests that require free tier:

1. **Setup:** Cancel existing subscription (if any)
   - Go to `/dashboard/settings`
   - Click "Manage subscription"
   - Cancel in Stripe portal
   - Wait for cancellation to take effect

2. **Run Test:**
   ```bash
   npm run test:e2e -- duplicate-prevention.spec.ts -g "Allows upgrade for users"
   ```

3. **Verify:**
   - Test should PASS (redirect to Stripe)
   - DO NOT complete checkout (leave test card unpaid)

## Stripe Test Cards

Use these cards for testing different scenarios:

| Card Number | Scenario |
|-------------|----------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 9995` | Card declined |
| `4000 0025 0000 3155` | Requires 3D Secure authentication |
| `4000 0000 0000 0341` | Attaching succeeds, charge fails |

**Expiry:** Any future date (e.g., `12/34`)  
**CVC:** Any 3 digits (e.g., `123`)  
**ZIP:** Any 5 digits (e.g., `12345`)

## What These Tests Catch

### ✅ Prevents Double Billing
- User with $10/month subscription cannot create $20/month duplicate
- Verifies fix for reported bug

### ✅ Validates All Entry Points
- Upgrade page UI
- Direct API calls
- Onboarding trial route

### ✅ Checks Error Handling
- User-friendly error messages
- Proper status codes
- No technical jargon exposed

### ✅ Edge Cases
- Concurrent upgrade attempts
- Rapid button clicks
- Different billing intervals
- Navigation during checkout

## Expected Behavior

### User WITH Active Subscription

**Before Fix (BUG):**
```
Click "Upgrade" → Redirected to Stripe → Complete checkout
→ Now has TWO subscriptions → Charged twice monthly ❌
```

**After Fix (CORRECT):**
```
Click "Upgrade" → Blocked with error message
→ "You already have an active subscription. Manage in Settings."
→ Still only ONE subscription ✅
```

### User WITHOUT Subscription

**Expected:**
```
Click "Upgrade" → Redirected to Stripe → Complete checkout
→ Subscription created → Pro access granted ✅
```

## Troubleshooting

### Test Skipped: "requires user with active subscription"

**Solution:**
1. Login to test user account manually
2. Complete subscription checkout
3. Verify subscription is active in Stripe dashboard
4. Re-run test

### Test Fails: "Should redirect to Stripe"

**Possible causes:**
- User already has subscription (cancel it first)
- Stripe keys not configured correctly
- API endpoint returning error

**Debug:**
```bash
npm run test:e2e -- duplicate-prevention.spec.ts -g "Allows upgrade" --headed --debug
```

### Test Fails: "Should block duplicate"

**This means the bug fix is NOT working!**

**Debug steps:**
1. Check app logs for "blocked duplicate" message
2. Verify Stripe test keys are used
3. Check `checkActiveSubscriptions()` is being called
4. Verify no errors in API response

### Webhook Not Processing

**Symptoms:**
- Completed checkout but status not updated
- Settings page still shows "Free"

**Solutions:**
1. Check webhook endpoint is configured: `http://localhost:3000/api/stripe/webhook`
2. Use Stripe CLI to forward webhooks:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
3. Check webhook secret matches in `.env.local`

## Continuous Integration

### GitHub Actions Setup

```yaml
# .github/workflows/e2e-subscriptions.yml
name: E2E Subscription Tests

on:
  pull_request:
    paths:
      - 'src/app/api/stripe/**'
      - 'src/features/pricing/**'
      - 'e2e/subscriptions/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      
      # Set up test environment
      - run: |
          echo "PLAYWRIGHT_BASE_URL=http://localhost:3000" > .env.e2e.local
          echo "E2E_OWNER_EMAIL=${{ secrets.E2E_OWNER_EMAIL }}" >> .env.e2e.local
          echo "E2E_OWNER_PASSWORD=${{ secrets.E2E_OWNER_PASSWORD }}" >> .env.e2e.local
      
      # Run tests
      - run: npm run test:e2e -- e2e/subscriptions/
      
      # Upload results
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

### Secrets to Configure
- `E2E_OWNER_EMAIL` - Test user email
- `E2E_OWNER_PASSWORD` - Test user password
- `STRIPE_SECRET_KEY` - Stripe test key (if not in repo)

## Manual Testing Checklist

Before deploying subscription changes to production:

- [ ] Run all E2E tests locally
- [ ] Verify duplicate prevention test PASSES
- [ ] Verify upgrade flow test PASSES
- [ ] Test with user who has $10 legacy subscription
- [ ] Test with user who has $20 current subscription
- [ ] Test with free tier user
- [ ] Check Stripe dashboard for duplicate subscriptions
- [ ] Verify error messages are user-friendly
- [ ] Test cancellation flow still works
- [ ] Check webhook logs for multi-subscription alerts

## Maintenance

### Updating Tests

When subscription logic changes:
1. Update test expectations in spec files
2. Update this README with new behavior
3. Add new test cases for new features
4. Run all tests to catch regressions

### Adding New Tests

```typescript
test('new subscription feature', async ({ page }) => {
  await loginAsOwner(page);
  
  // Test setup
  
  // Action
  
  // Assertions
  expect(/* ... */).toBe(/* ... */);
});
```

## Support

If tests fail or you need help:
1. Check this README first
2. Review test output and screenshots in `playwright-report/`
3. Run with `--headed --debug` to watch browser
4. Check Stripe dashboard for actual subscription state
5. Compare DB state vs Stripe state

## Related Documentation

- [Stripe Subscription Edge Cases Analysis](../../docs/stripe-subscription-edge-cases-analysis.md)
- [Bug Fix Summary](../../BUGFIX_SUMMARY.md)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Playwright Documentation](https://playwright.dev)
