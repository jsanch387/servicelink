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
├── subscription-payment-failed/ (legacy send helper; not used by webhooks)
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
- **`subscription-payment-failed/`** – `sendSubscriptionPaymentFailedEmail` exists for reuse/manual sends; **`invoice.payment_failed` does not send email** (in-app Settings handles payment issues).
- **`trial-ending-soon/`** – sends a pre-charge reminder (triggered from Stripe trial ending webhook flow).

## Billing/trial email flow

These emails are orchestrated from `src/app/api/stripe/webhook/route.ts`:

- **`customer.subscription.trial_will_end`**
  - Triggers `sendTrialEndingSoonEmail(to, { trialEndsAtIso })`.
  - Current implementation uses Stripe event timing (simple/reliable baseline).
  - Email CTA goes to Dashboard Settings (`/dashboard/settings`) so users can manage billing details.

- **`invoice.payment_failed`**
  - **No Resend email.** Updates the profile via subscription sync only (`past_due` / etc.) so the Settings banner and portal flow stay correct.

### Why this design

- Trial email stays on Stripe’s `trial_will_end` + Resend; payment failures are surfaced in-app to avoid duplicate or mistimed mail (e.g. retries after cancel).

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
