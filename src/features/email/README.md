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
├── quote-sent-to-customer/   (owner sent quote → customer email)
│   ├── README.md
│   ├── types.ts
│   ├── quoteSentToCustomerTemplate.ts
│   └── sendQuoteSentToCustomerEmail.ts
└── pro-welcome/              (first paid Pro upgrade → owner email, links to ads workshop)
    ├── types.ts
    ├── proWelcomeTemplate.ts
    └── sendProWelcomeEmail.ts
```

- **`services/`** – shared Resend client and URL/from helpers used by all email types.
- **`utils/`** – shared helpers (e.g. escaping for HTML).
- **`booking-notification/`** – one subfolder per “email use case”; each can have its own README, types, template, and send function.
- **`subscription-payment-failed/`** – `sendSubscriptionPaymentFailedEmail`, sent once per failure episode from `invoice.payment_failed` via `notifyPaymentFailedOnce` (in-app Settings still handles the actual fix).

## Billing email flow

These emails are orchestrated from `src/app/api/stripe/webhook/route.ts`:

- **`checkout.session.completed` / `customer.subscription.updated` (first paid Pro)**
  - Triggers `sendProWelcomeEmail` via `sendProWelcomeIfFirstPaidPro` (in `@/features/pricing/server`).
  - Sends **once, ever**: only on the user's first **paid, active** Pro upgrade. Guarded by an atomic claim on `profiles.pro_welcome_email_sent_at`, so renewals and cancel → resubscribe never re-send. See `src/app/api/stripe/README.md` for the column + backfill SQL.
  - CTA links to the Meta ads workshop gate (`/workshop`).

- **`invoice.payment_failed`**
  - Syncs the profile via subscription sync (`past_due` / etc.) **and** sends a single "payment failed" email via `notifyPaymentFailedOnce` → `sendSubscriptionPaymentFailedEmail`.
  - Stripe retries fire this event repeatedly, so sending is guarded by an atomic claim on `profiles.payment_failed_email_sent_at` (one email per failure episode). The flag clears when the subscription recovers. See `src/app/api/stripe/README.md` for the column SQL.

### Why this design

- We send our **own** payment-failed email (not Stripe's) so the owner gets exactly one on-brand heads-up per failure instead of one per retry; the Settings banner + portal still handle the in-app fix.

## Stripe events required in production

To keep billing emails and access gating working, configure these events on your prod webhook endpoint:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
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
