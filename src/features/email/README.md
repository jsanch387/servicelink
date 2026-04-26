# Email feature

Transactional email for the app. Sending is done via **Resend**. All email functionality lives under this feature so we can add more types (e.g. booking reminders, password reset, marketing) in one place.

## Structure

```
email/
├── README.md                 (this file)
├── index.ts                  (public API)
├── services/
│   └── resendClient.ts       (Resend client, app base URL, from address)
├── utils/
│   └── escapeHtml.ts         (safe HTML for email content)
├── booking-notification/     (new booking request → owner email)
│   ├── README.md
│   ├── types.ts
│   ├── bookingNotificationTemplate.ts
│   └── sendBookingNotificationEmail.ts
├── subscription-payment-failed/ (billing failure reminder)
│   ├── types.ts
│   └── sendSubscriptionPaymentFailedEmail.ts
├── trial-ending-soon/        (trial reminder before first charge)
│   ├── types.ts
│   └── sendTrialEndingSoonEmail.ts
└── quote-sent-to-customer/   (owner sent quote → customer email)
    ├── README.md
    ├── types.ts
    ├── quoteSentToCustomerTemplate.ts
    └── sendQuoteSentToCustomerEmail.ts
```

- **`services/`** – shared Resend client and URL/from helpers used by all email types.
- **`utils/`** – shared helpers (e.g. escaping for HTML).
- **`booking-notification/`** – one subfolder per “email use case”; each can have its own README, types, template, and send function.
- **`subscription-payment-failed/`** – sends a payment update reminder when account first transitions into a delinquent/ended billing state.
- **`trial-ending-soon/`** – sends a pre-charge reminder (triggered from Stripe trial ending webhook flow).

## Billing/trial email flow

These emails are orchestrated from `src/app/api/stripe/webhook/route.ts`:

- **`customer.subscription.trial_will_end`**
  - Triggers `sendTrialEndingSoonEmail(to, { trialEndsAtIso })`.
  - Current implementation uses Stripe event timing (simple/reliable baseline).
  - Email CTA goes to Dashboard Settings (`/dashboard/settings`) so users can manage billing details.

- **`invoice.payment_failed`**
  - Triggers `sendSubscriptionPaymentFailedEmail(to)` **only on first transition**
    into a delinquent/ended state.
  - Anti-spam rule: do not send on every retry attempt if user is already
    `past_due` / `unpaid` / `canceled` / `incomplete` / `incomplete_expired`.

### Why this design

- Keeps reminder timing reliable with low complexity.
- Prevents repeated "payment failed" email spam during Stripe retry cycles.
- Maintains a single source of truth in webhook handlers for billing lifecycle messaging.

## Stripe events required in production

To keep billing/trial emails and access gating working, configure these events on your prod webhook endpoint:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `customer.subscription.trial_will_end`
- `invoice.payment_failed`

## Adding a new email type

1. Create a subfolder, e.g. `welcome/` or `booking-reminder/`.
2. Add `types.ts`, a template (or inline HTML), and a `send*.ts` that uses `getResendClient()`, `getAppBaseUrl()`, `getFromEmail()` from `../services/resendClient`.
3. Export the send function (and types if needed) from `email/index.ts`.

## Environment

See **booking-notification/README.md** for the booking email. In general:

- `RESEND_API_KEY` – required for any sending.
- `RESEND_FROM_EMAIL` – optional; default from address.
- `NEXT_PUBLIC_SITE_URL` – optional; base URL for links in emails.
