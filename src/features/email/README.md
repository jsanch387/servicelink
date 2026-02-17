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
└── booking-notification/     (new booking request → owner email)
    ├── README.md             (booking notification–specific docs)
    ├── types.ts
    ├── bookingNotificationTemplate.ts
    └── sendBookingNotificationEmail.ts
```

- **`services/`** – shared Resend client and URL/from helpers used by all email types.
- **`utils/`** – shared helpers (e.g. escaping for HTML).
- **`booking-notification/`** – one subfolder per “email use case”; each can have its own README, types, template, and send function.

## Adding a new email type

1. Create a subfolder, e.g. `welcome/` or `booking-reminder/`.
2. Add `types.ts`, a template (or inline HTML), and a `send*.ts` that uses `getResendClient()`, `getAppBaseUrl()`, `getFromEmail()` from `../services/resendClient`.
3. Export the send function (and types if needed) from `email/index.ts`.

## Environment

See **booking-notification/README.md** for the booking email. In general:

- `RESEND_API_KEY` – required for any sending.
- `RESEND_FROM_EMAIL` – optional; default from address.
- `NEXT_PUBLIC_SITE_URL` – optional; base URL for links in emails.
