# SMS outbound status

Telnyx is wired into `sendSms`. Outbound sends require the hardcoded master
switch `SMS_OUTBOUND_ENABLED = true` in
`src/features/sms/config/isSmsOutboundEnabled.ts`.

## Channel rule — booking confirmation

| Contact on file | What we send                                          |
| --------------- | ----------------------------------------------------- |
| Phone only      | SMS confirmation                                      |
| Email only      | Email confirmation (full details)                     |
| Both            | **Both** — SMS is a short ping; email has the details |

Lifecycle actions (`on_the_way`, etc.) remain SMS-only.

## Live

| Customer flow                                                                | Message type                       | File                                                                               |
| ---------------------------------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------- |
| New booking — public web / owner manual (mobile `POST /api/public/bookings`) | `booking_confirmation`             | `src/app/api/public/bookings/route.ts`                                             |
| New booking — Stripe checkout webhook                                        | `booking_confirmation`             | `src/app/api/stripe/webhook/route.ts`                                              |
| Owner taps **On my way**                                                     | `on_the_way`                       | `src/app/api/availability/bookings/[id]/actions/route.ts`                          |
| Owner taps **Job started**                                                   | `job_started`                      | `src/app/api/availability/bookings/[id]/actions/route.ts`                          |
| Owner taps **Done** (work handoff)                                           | `work_finished`                    | `src/features/availability/booking/server/handleWorkFinishedAction.ts`             |
| Owner completes job — invoice / receipt (`job_completed`)                    | `job_completed` (SMS and/or email) | `src/features/availability/booking/server/sendJobCompletedCustomerNotification.ts` |

## Still paused

| Customer flow                                  | Message type                                            | File                                                                   | Email still sent?                                            |
| ---------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------ |
| Web dashboard **Complete** (legacy PATCH path) | `job_completed` (courtesy) + `review_invite` via helper | `src/features/availability/services/completeBookingWithSideEffects.ts` | Yes — review invite email via `createReviewInviteIfEligible` |
| Review invite (SMS-first when enabled)         | `review_invite`                                         | `src/features/reviews/server/createReviewInviteIfEligible.ts`          | Yes — email when SMS paused or fails                         |

## Global safety switch

`sendAndRecordSms` returns `{ sent: false, reason: 'not_configured' }` when
`SMS_OUTBOUND_ENABLED` is `false` in
`src/features/sms/config/isSmsOutboundEnabled.ts` (hardcoded; no env var).

## Eligibility (in addition to the master switch)

Checked inside `sendAndRecordSms` before any send/log:

1. **Pro** — business owner must pass `isProAccess` (paying / active Pro). No
   per-business SMS toggle; Pro unlocks SMS automatically.
2. **Optional rollout allowlist** — if `SMS_ROLLOUT_OWNER_EMAILS` is non-empty
   (`src/features/sms/config/smsRolloutAllowlist.ts`), only listed owner emails
   may send. Empty (current) = all Pro owners.

Ineligible sends return `{ sent: false, reason: 'not_eligible' }`.

## Related contracts

- [`docs/contracts/mobile-booking-actions.md`](./contracts/mobile-booking-actions.md)
- [`docs/contracts/mobile-booking-work-finished.md`](./contracts/mobile-booking-work-finished.md)
- [`docs/contracts/mobile-booking-job-completed.md`](./contracts/mobile-booking-job-completed.md)

## Last updated

2026-08-04 — SMS open to all Pro owners (rollout allowlist cleared).
