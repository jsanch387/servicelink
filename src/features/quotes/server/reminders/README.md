# Quote request follow-ups

One cron job, owner only. Schedule and auth live in [`src/features/cron`](../../../cron/docs/README.md).

`runQuoteRequestFollowUps` is what `/api/internal/cron/quote-request-follow-ups` calls.

```
reminders/
  runQuoteRequestFollowUps.ts           cron entry
  notifyOwnerForQuoteRequestFollowUp.ts insert-first inbox + push
  loadStaleCustomerQuoteRequests.ts     window query + group by owner
  quoteRequestFollowUpCopy.ts           title / body / dedupe key
  quoteRequestFollowUpDate.ts           Chicago day + 3-day window
  constants.ts
```

| Rule         | Detail                                                                        |
| ------------ | ----------------------------------------------------------------------------- |
| Who          | `customer_requested` + `requested`, 24h–4 days old                            |
| Cadence      | One push per owner per Chicago day, for 3 days, then stop                     |
| Skip         | Already got a `quote_request` ping in the last 24h                            |
| Idempotency  | `notifications.dedupe_key` = `quote_request_followup:{profileId}:{localDate}` |
| Tap          | `screen` → `quotes`                                                           |
| Not this job | New request ping, owner email, customer `/q/` 14-day expiry                   |
