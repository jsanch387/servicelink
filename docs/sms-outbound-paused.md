# SMS outbound paused (production)

Outbound customer SMS is **intentionally disabled** until Pingram carrier approval and sender setup are ready in production. The SMS module (builders, logging, idempotency, `sendAndRecordSms`) stays in the codebase; **send calls at each product flow are commented out** so nothing is texted accidentally.

Email notifications continue where a customer email exists.

## Re-enable checklist

1. Finish Pingram / carrier approval and production sender configuration.
2. Set `SMS_OUTBOUND_ENABLED=true` in the server environment (see `isSmsOutboundEnabled.ts`).
3. Uncomment the blocks marked `SMS_OUTBOUND_PAUSED` in each file below.
4. Restore SMS-first behavior tests that expect `sendAndRecordSms` to be called.
5. Smoke-test each flow in staging before production.

## Global safety switch

`sendAndRecordSms` also returns `{ sent: false, reason: 'not_configured' }` when `SMS_OUTBOUND_ENABLED` is not `true`. That is defense-in-depth; the commented call sites are the source of truth for which flows are paused.

## Paused call sites

| Customer flow                                                               | Message type                                            | File                                                                               | Email still sent?                                              |
| --------------------------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| New booking — public web, owner manual (mobile `POST /api/public/bookings`) | `booking_confirmation`                                  | `src/app/api/public/bookings/route.ts`                                             | Yes — customer confirmation email when `customer.email` is set |
| New booking — Stripe checkout webhook                                       | `booking_confirmation`                                  | `src/app/api/stripe/webhook/route.ts`                                              | Yes — customer confirmation email in deferred `after()` block  |
| Owner taps **On my way**                                                    | `on_the_way`                                            | `src/app/api/availability/bookings/[id]/actions/route.ts`                          | N/A                                                            |
| Owner taps **Job started**                                                  | `job_started`                                           | `src/app/api/availability/bookings/[id]/actions/route.ts`                          | N/A                                                            |
| Owner taps **Done** (work handoff)                                          | `work_finished`                                         | `src/features/availability/booking/server/handleWorkFinishedAction.ts`             | N/A                                                            |
| Owner completes job — invoice / receipt (`job_completed`)                   | `job_completed`                                         | `src/features/availability/booking/server/sendJobCompletedCustomerNotification.ts` | Yes — invoice link email when `customer_email` is set          |
| Web dashboard **Complete** (legacy PATCH path)                              | `job_completed` (courtesy) + `review_invite` via helper | `src/features/availability/services/completeBookingWithSideEffects.ts`             | Yes — review invite email via `createReviewInviteIfEligible`   |
| Review invite (SMS-first when enabled)                                      | `review_invite`                                         | `src/features/reviews/server/createReviewInviteIfEligible.ts`                      | Yes — email when SMS paused or fails                           |

## Not paused (still active)

| Flow                                                       | Channel                                            |
| ---------------------------------------------------------- | -------------------------------------------------- |
| Owner new-booking notification                             | Email (`notifyOwnerForAvailabilityBookingCreated`) |
| Customer booking confirmation                              | Email (when address provided)                      |
| Job completed invoice / receipt                            | Email (when address provided)                      |
| Review invite                                              | Email (when address provided)                      |
| Pro welcome, trial ending, maintenance, quote emails, etc. | Email only — never used SMS                        |

## Related contracts

- [`docs/contracts/mobile-owner-create-booking.md`](./contracts/mobile-owner-create-booking.md) — owner manual booking; confirmation SMS paused, email unchanged
- [`docs/contracts/mobile-booking-actions.md`](./contracts/mobile-booking-actions.md) — lifecycle actions; `sms` block returns `reason: "not_configured"` while paused
- [`docs/contracts/mobile-booking-work-finished.md`](./contracts/mobile-booking-work-finished.md) — Done/Skip; no `work_finished` text while paused
- [`docs/contracts/mobile-booking-job-completed.md`](./contracts/mobile-booking-job-completed.md) — Complete sheet; invoice **email** while paused
- [`docs/contracts/mobile-booking-tap-to-pay.md`](./contracts/mobile-booking-tap-to-pay.md) — Tap to Pay; receipt via email after `job_completed`

All five mobile contracts include an **SMS outbound paused** banner at the top (2026-07).

## Last updated

2026-07-05 — Initial pause: booking confirmation, lifecycle actions, work finished, job completed, review invite.
