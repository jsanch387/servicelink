# Quotes E2E

Small, high-value Playwright coverage for the quote lifecycle.

## Covered

1. **Owner custom quote**
   - Creates through the dashboard UI.
   - Uses a custom service.
   - Lets the customer choose date/time.
   - Verifies the send payload, persisted read model, inbox row, detail screen,
     public-link availability, and null catalog/schedule fields.

2. **Customer request → owner catalog quote**
   - Customer submits the public request UI.
   - Verifies the `requested` row and owner request inbox/detail.
   - Owner first-sends the same row with the first saved service.
   - Selects the first price option and add-on when the chosen service has them.
   - Verifies catalog snapshots, lifecycle transition to `sent`, public link,
     and customer-selected scheduling.

The suite deliberately leaves exhaustive validation and rare edge cases to
Vitest. It targets user-visible integration boundaries instead.

## Test-data marker and cleanup

Every test customer starts with:

```text
E2E Quote Customer
```

Every service/request/note also includes a unique `E2E-...` marker. Tests delete
their quote by API id in `finally`. Before each test, stale rows with the exact
customer prefix are removed to recover from interrupted runs.

Cleanup never matches normal customer rows.

## Required E2E account state

- Dedicated owner credentials in `.env.e2e.local`
- Onboarding complete
- At least one active saved service
- Pro access with public quote requests enabled
- Public business slug configured (or resolvable from `/api/dashboard/data`)
- Quote schema migration applied (`service_id`, `service_price_option_id`,
  `service_price_cents`, `addon_details`, optional sent schedule)

The selected catalog service does not need options or add-ons. The test asserts
those snapshots only when the service exposes those phases.

## Run

```bash
npm run test:e2e -- e2e/quotes/quotes.spec.ts
```

Visible browser:

```bash
npm run test:e2e:headed -- e2e/quotes/quotes.spec.ts
```
