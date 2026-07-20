# E2E Testing Quickstart - Subscription Flows

Quick guide to run the E2E tests for the duplicate subscription bug fix.

## 🚀 Quick Setup (5 minutes)

### 1. Install Dependencies
```bash
npm install
npx playwright install chromium
```

### 2. Configure Test Environment

Create `.env.e2e.local`:
```bash
cp .env.e2e.example .env.e2e.local
```

Edit `.env.e2e.local`:
```bash
PLAYWRIGHT_BASE_URL=http://localhost:3000
E2E_OWNER_EMAIL=your-test-email@example.com
E2E_OWNER_PASSWORD=YourTestPassword123
```

### 3. Verify Stripe Test Keys

Check `.env.local` has test keys:
```bash
STRIPE_SECRET_KEY=sk_test_...  # Must start with sk_test_
STRIPE_PRO_PRICE_ID=price_...  # Your test price ID
```

## 🎯 Running Tests

### Run All Subscription Tests
```bash
npm run test:e2e -- e2e/subscriptions/
```

### Run Only Critical Duplicate Prevention Tests
```bash
npm run test:e2e -- e2e/subscriptions/duplicate-prevention.spec.ts
```

### Watch Tests in Browser (Debug Mode)
```bash
npm run test:e2e -- e2e/subscriptions/ --headed --debug
```

## 📋 Test Scenarios

### Scenario 1: Test Duplicate Prevention (CRITICAL)

**Setup:**
1. Create/use test user account
2. Manually complete ONE subscription checkout:
   - Login to your app
   - Go to `/dashboard/upgrade`
   - Click upgrade
   - Use test card: `4242 4242 4242 4242`
   - Complete checkout
   - Verify subscription appears in `/dashboard/settings`

**Run Test:**
```bash
npm run test:e2e -- duplicate-prevention.spec.ts -g "CRITICAL"
```

**Expected Result:** ✅ PASS
- Test attempts to create duplicate subscription
- System blocks it with error
- Verify only 1 subscription in Stripe dashboard

**If Test FAILS:** 🔴
- Bug fix is NOT working!
- Check implementation
- Review logs for errors

### Scenario 2: Test Upgrade Flow for New Users

**Setup:**
1. Create/use test user WITHOUT subscription
2. If user has subscription, cancel it first

**Run Test:**
```bash
npm run test:e2e -- duplicate-prevention.spec.ts -g "Allows upgrade"
```

**Expected Result:** ✅ PASS
- User CAN start upgrade
- Redirects to Stripe checkout
- (Don't complete payment in test)

## 🧪 Stripe Test Cards

| Card | Scenario |
|------|----------|
| `4242 4242 4242 4242` | ✅ Success |
| `4000 0000 0000 9995` | ❌ Declined |

- **Expiry:** `12/34` (any future date)
- **CVC:** `123` (any 3 digits)
- **ZIP:** `12345` (any 5 digits)

## 📊 What Tests Validate

### ✅ Duplicate Prevention
- [x] User with active sub cannot create duplicate via UI
- [x] User with active sub cannot create duplicate via API
- [x] Error messages are clear and helpful
- [x] Concurrent requests handled safely

### ✅ Normal Flows Still Work
- [x] Free users CAN upgrade
- [x] Settings page displays correctly
- [x] Upgrade page navigation works
- [x] API endpoints return valid responses

## 🔍 Checking Test Results

### View Test Report
```bash
npx playwright show-report
```

### Check Stripe Dashboard
- Go to https://dashboard.stripe.com/test/subscriptions
- Verify only 1 subscription per customer
- Check subscription IDs match app database

### Check App Logs
Look for these log messages:
```
✓ "blocked duplicate subscription attempt"
✓ "customer has active subscription(s)"
✓ "DUPLICATE_SUBSCRIPTION_BLOCKED"
```

## 🐛 Troubleshooting

### Test Skipped: "requires user with active subscription"
**Fix:** Complete manual subscription first (see Scenario 1 setup)

### Test Fails: "Should block duplicate"
**This means bug fix is broken!**
- Check `checkActiveSubscriptions()` is imported
- Verify Stripe test keys are used
- Review API response in test output

### Webhook Not Processing
**Fix:** Use Stripe CLI to forward webhooks:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### "Cannot find test user"
**Fix:** Update E2E_OWNER_EMAIL in `.env.e2e.local`

## 📝 Pre-Deploy Checklist

Before merging bug fix to production:

- [ ] All E2E tests passing locally
- [ ] Duplicate prevention test PASSES with active subscription
- [ ] Upgrade flow test PASSES with free user
- [ ] No duplicate subscriptions in Stripe test dashboard
- [ ] Error messages are user-friendly
- [ ] Checked both monthly and yearly billing
- [ ] Verified legacy $10 users still work

## 🎬 Full Test Run Example

```bash
# 1. Start dev server (separate terminal)
npm run dev

# 2. Run all subscription tests
npm run test:e2e -- e2e/subscriptions/

# 3. View results
npx playwright show-report
```

**Expected Output:**
```
Running 12 tests using 1 worker

✓ duplicate-prevention.spec.ts:28 - CRITICAL: Prevents duplicate subscription
✓ duplicate-prevention.spec.ts:65 - CRITICAL: API blocks duplicate
✓ subscription-flows.spec.ts:15 - displays correct subscription status
...

12 passed (45s)
```

## 📚 More Info

- Full test documentation: `e2e/subscriptions/README.md`
- Bug fix details: `BUGFIX_SUMMARY.md`
- Edge case analysis: `docs/stripe-subscription-edge-cases-analysis.md`

## 🆘 Need Help?

1. Check test output screenshots in `playwright-report/`
2. Run with `--headed --debug` to watch browser
3. Review `e2e/subscriptions/README.md` for detailed troubleshooting
4. Compare Stripe dashboard vs database state

---

**TL;DR:**
```bash
# Setup (once)
cp .env.e2e.example .env.e2e.local
# Edit .env.e2e.local with test user credentials

# Run tests
npm run test:e2e -- e2e/subscriptions/

# Expected: All tests pass ✅
```

**Critical Test:** Must pass before deploy
```bash
npm run test:e2e -- duplicate-prevention.spec.ts -g "CRITICAL"
```

If this fails, the duplicate subscription bug is NOT fixed! 🚨
