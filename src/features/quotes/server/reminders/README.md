# Quote reminders

Two cron jobs. Schedule and auth live in [`src/features/cron`](../../../cron/docs/README.md).

## Owner — unanswered requests

`runQuoteRequestFollowUps` is what `/api/internal/cron/quote-request-follow-ups` calls.

| Rule         | Detail                                                                        |
| ------------ | ----------------------------------------------------------------------------- |
| Who          | `customer_requested` + `requested`, 24h–4 days old                            |
| Cadence      | One push per owner per Chicago day, for 3 days, then stop                     |
| Skip         | Already got a `quote_request` ping in the last 24h                            |
| Idempotency  | `notifications.dedupe_key` = `quote_request_followup:{profileId}:{localDate}` |
| Tap          | `screen` → `quotes`                                                           |
| Not this job | Customer `/q/` reminder, new request ping, owner email                        |

## Customer — unanswered sent quotes

`runQuoteCustomerReminders` is what `/api/internal/cron/quote-customer-reminders` calls.

Email and SMS go out together. If we text, the body includes the same `/q/` URL as the email (`token_hash` works on `/q/[token]` via `resolveQuoteTokenHash`).

| Rule         | Detail                                                                    |
| ------------ | ------------------------------------------------------------------------- |
| Who          | Status `sent` or `viewed`, 2–4 days after `sent_at`                       |
| Cadence      | Once ever                                                                 |
| Skip         | Approved, declined, expired, cancelled, no contact, dead `/q/` link       |
| SMS skip     | No phone, SMS opt-out, business not eligible, outbound paused             |
| Idempotency  | `quotes.customer_reminder_sent_at` claim, plus `{quoteId}:quote_reminder` |
| SMS link     | `sms_messages.quote_id` + `type = quote_reminder`                         |
| Timeline     | `quote_outbound_events` (email + SMS). Exposed as `communications`        |
| Not this job | Owner follow-up for unsent customer requests                              |
