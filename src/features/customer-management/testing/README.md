# Customer Management Tests

Focused tests for core customer-management behavior (high value, low noise).

## What we test

- `matchesCustomerQuery.test.ts`
  - Search behavior is **name-only**.
  - Prevents regressions where hidden fields (email/phone/note/service) affect results.

- `formatNextInDays.test.ts`
  - Relative day labels: `Today`, `Tomorrow`, and `in N days`.
  - Fallback behavior when appointment date input is invalid/missing.

- `aggregateBookingsPerCustomer.test.ts`
  - Core booking metrics aggregation:
    - completed visits + total spent
    - latest completed visit details
    - earliest upcoming confirmed appointment
    - ignores cancelled/unlinked rows

## Why this scope

We test core logic paths that directly affect customer list and detail accuracy, without over-testing purely visual details.
