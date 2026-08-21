# Mobile / public API contracts

Hand-off docs for native and public clients. **Web implementation lives in this repo**; the app should follow these instead of calling Stripe or writing memberships/bookings directly.

## Subscriptions (customer memberships)

Read first, then writes in the order an owner typically uses them.

| Doc                                                                                        | What it covers                                                             |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| [mobile-subscriptions-phase1-data.md](./mobile-subscriptions-phase1-data.md)               | Plans + subscribers: tables, SELECT, mapped UI fields                      |
| [mobile-subscriptions-period-visit.md](./mobile-subscriptions-period-visit.md)             | `visitStatus` (needs visit / scheduled / complete)                         |
| [mobile-subscriptions-owner-book-visit.md](./mobile-subscriptions-owner-book-visit.md)     | Owner books a covered visit (`POST /api/public/bookings` + `membershipId`) |
| [mobile-subscriptions-send-schedule-link.md](./mobile-subscriptions-send-schedule-link.md) | Email/SMS the public schedule link                                         |
| [mobile-booking-cancel.md](./mobile-booking-cancel.md)                                     | Cancel an appointment (frees the period visit)                             |
| [mobile-subscriptions-cancel.md](./mobile-subscriptions-cancel.md)                         | Cancel the **membership** (period-end or now)                              |

Owner dashboard docs: `src/features/subscriptions/docs/`.

## Bookings

| Doc                                                                                    | What it covers                                                       |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| [mobile-owner-create-booking.md](./mobile-owner-create-booking.md)                     | Owner create (legacy single-job)                                     |
| [mobile-owner-create-booking-multi-job.md](./mobile-owner-create-booking-multi-job.md) | Owner create (`jobs[]`)                                              |
| [mobile-owner-create-booking-sale.md](./mobile-owner-create-booking-sale.md)           | Sale / discount on create                                            |
| [public-multi-job-booking.md](./public-multi-job-booking.md)                           | Public multi-job book                                                |
| [mobile-booking-actions.md](./mobile-booking-actions.md)                               | On the way / start / complete + SMS                                  |
| [mobile-sms-skip.md](./mobile-sms-skip.md)                                             | When we skip the customer text (`sms.reason`); do not block the flow |
| [mobile-booking-work-finished.md](./mobile-booking-work-finished.md)                   | Done / Skip                                                          |
| [mobile-booking-job-completed.md](./mobile-booking-job-completed.md)                   | Complete sheet                                                       |
| [mobile-booking-cancel.md](./mobile-booking-cancel.md)                                 | Cancel appointment                                                   |
| [mobile-booking-tap-to-pay.md](./mobile-booking-tap-to-pay.md)                         | Tap to pay                                                           |
| [mobile-review-invite-on-complete.md](./mobile-review-invite-on-complete.md)           | Review invite                                                        |

## Quotes, maintenance, onboarding, other

| Doc                                                                          | What it covers      |
| ---------------------------------------------------------------------------- | ------------------- |
| [mobile-quote-read.md](./mobile-quote-read.md)                               | Read quotes         |
| [mobile-quote-send.md](./mobile-quote-send.md)                               | Send quote          |
| [mobile-maintenance-enrollment.md](./mobile-maintenance-enrollment.md)       | Maintenance plans   |
| [mobile-onboarding-complete.md](./mobile-onboarding-complete.md)             | Onboarding complete |
| [mobile-stripe-connect-onboarding.md](./mobile-stripe-connect-onboarding.md) | Connect onboarding  |
| [mobile-entitlement-paywall.md](./mobile-entitlement-paywall.md)             | Pro paywall         |
| [mobile-push-notifications.md](./mobile-push-notifications.md)               | Expo push           |
| [Cron feature](../../src/features/cron/docs/README.md)                       | Scheduled jobs (first: owner appointment reminder) |
| [mobile-contact-form.md](./mobile-contact-form.md)                           | Public contact form |
| [mobile-service-area-collection.md](./mobile-service-area-collection.md)     | Service area        |
| [service-categories-data.md](./service-categories-data.md)                   | Service categories  |

## Conventions

- **Auth:** `Authorization: Bearer <Supabase access_token>` unless the doc says public / token.
- **Writes:** server owns Stripe, email, SMS, and membership columns. App triggers actions and reads state.
- **Tenancy:** owner APIs resolve `business_id` from the authenticated profile, not a client-supplied id (optional `businessId` on some writes is checked to match).
