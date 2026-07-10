# Marketing — E2E testing

**Status:** Foundation only — automated specs are **skipped** (`marketing.spec.ts`).  
**In scope now:** Dashboard CRUD for promo codes and sales.  
**Out of scope (next phase):** Public booking link, discount application, redemption at completion.

Product rules: `src/features/marketing/docs/FLOWS.md`

---

## Manual regression checklist (v1)

Run after marketing or shared dashboard/auth changes. Use your E2E test account.

### Promo codes

- [ ] Open `/dashboard/marketing` — list loads (no infinite skeleton)
- [ ] **New Promo Code** → create with code + % discount → success or redirect to list
- [ ] Code appears in **Promo Codes** tab with correct discount and status
- [ ] Copy code button → clipboard + checkmark feedback
- [ ] Toggle **Active** off → on (no silent failure; error banner if API fails)
- [ ] **Edit** → form pre-filled → change discount → **Save changes** → list updated
- [ ] **Delete** → confirm modal → row removed
- [ ] Mobile: card layout shows Edit / Delete / toggle

### Sales

- [ ] **New Sale** → create with name + discount (with optional dates off)
- [ ] Sale appears in **Sales** tab
- [ ] Toggle active on sale A, then on sale B → only B stays active (one active sale rule)
- [ ] **Edit** → save → list updated
- [ ] **Delete** → confirm → removed
- [ ] Mobile: same actions visible

### Edge cases (when time allows)

- [ ] Duplicate promo code → clear error
- [ ] Invalid discount (0%, >100%) → validation on form
- [ ] Edit while inactive → still saves

---

## Automated specs

File: `marketing.spec.ts` — **active** (run with `npm run test:e2e -- e2e/marketing/marketing.spec.ts`)

| Test | Covers |
| ---- | ------ |
| Promo code CRUD | Create → list → toggle off/on → edit discount → delete |
| Sale CRUD | Create → list → toggle → edit name/discount → delete |
| One active sale | Create two active sales → first auto-deactivates |

Helpers: `e2e/fixtures/marketing-helpers.ts`  
Test data uses `E2E…` prefix and is cleaned up after each test.

---

## Test data conventions

- Prefix automated codes with `E2E` + timestamp, e.g. `E2ETEST1234`, so they’re easy to spot and clean up.
- Delete test rows after each run (tests should clean up in `afterEach` when implemented).
