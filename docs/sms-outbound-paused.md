# SMS outbound status

Telnyx is wired into `sendSms`. Outbound sends require `SMS_OUTBOUND_ENABLED=true`.

## Channel rule — booking confirmation

| Contact on file | What we send                                          |
| --------------- | ----------------------------------------------------- |
| Phone only      | SMS confirmation                                      |
| Email only      | Email confirmation (full details)                     |
| Both            | **Both** — SMS is a short ping; email has the details |

Lifecycle actions (`on_the_way`, etc.) remain SMS-only.

## Live

| Customer flow                                                                | Message type                                | File                                                                               |
| ---------------------------------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------- |
| New booking — public web / owner manual (mobile `POST /api/public/bookings`) | `booking_confirmation`                      | `src/app/api/public/bookings/route.ts`                                             |
| New booking — Stripe checkout webhook                                        | `booking_confirmation`                      | `src/app/api/stripe/webhook/route.ts`                                              |
| Owner taps **On my way**                                                     | `on_the_way`                                | `src/app/api/availability/bookings/[id]/actions/route.ts`                          |
| Owner taps **Job started**                                                   | `job_started`                               | `src/app/api/availability/bookings/[id]/actions/route.ts`                          |
| Owner taps **Done** (work handoff)                                           | `work_finished`                             | `src/features/availability/booking/server/handleWorkFinishedAction.ts`             |
| Owner completes job — invoice / receipt (`job_completed`)                    | `job_completed` (SMS-first; email fallback) | `src/features/availability/booking/server/sendJobCompletedCustomerNotification.ts` |

## Still paused

| Customer flow                                  | Message type                                            | File                                                                   | Email still sent?                                            |
| ---------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------ |
| Web dashboard **Complete** (legacy PATCH path) | `job_completed` (courtesy) + `review_invite` via helper | `src/features/availability/services/completeBookingWithSideEffects.ts` | Yes — review invite email via `createReviewInviteIfEligible` |
| Review invite (SMS-first when enabled)         | `review_invite`                                         | `src/features/reviews/server/createReviewInviteIfEligible.ts`          | Yes — email when SMS paused or fails                         |

## Global safety switch

`sendAndRecordSms` returns `{ sent: false, reason: 'not_configured' }` when
`SMS_OUTBOUND_ENABLED` is not `true`.

## Related contracts

- [`docs/contracts/mobile-booking-actions.md`](./contracts/mobile-booking-actions.md)
- [`docs/contracts/mobile-booking-work-finished.md`](./contracts/mobile-booking-work-finished.md)
- [`docs/contracts/mobile-booking-job-completed.md`](./contracts/mobile-booking-job-completed.md)

## Last updated

2026-08-01 — Re-enabled job-completed receipt SMS (short `/r/…` link; email only if SMS does not send).
