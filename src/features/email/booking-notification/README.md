# Booking notification email

When a customer submits a booking request on a **public business profile**, the business owner receives an email so they can open the app and act on it.

## Flow

1. Customer visits `/{business-slug}` and goes to `/{business-slug}/book`.
2. Customer submits the booking form (name, phone, service, preferred date/time, optional message).
3. **API**: `POST /api/booking-request/submit` creates the booking and an in-app notification.
4. **This feature**: the same route resolves the owner’s email and calls `sendBookingNotificationEmail(to, payload)`.
5. Owner receives an email with:
   - Subject: “New booking request from {customer name}”
   - Body: customer name, service, preferred date, preferred time
   - CTA: “View bookings in dashboard” → links to `/dashboard/bookings`.

If the email is sent successfully, the booking row is updated with `notification_sent: true` and `notification_sent_at`.

## Owner email resolution

The “to” address is chosen in this order:

1. **`business_profiles.email`** – contact email on the business profile (if set).
2. **Supabase Auth** – the owner’s auth user (by `profile_id`) email, via `admin.auth.admin.getUserById(profileId)`.

If no email is found, the email is skipped and a warning is logged; the booking and in-app notification are still created.

## Environment variables

| Variable               | Required | Description                                                                                                      |
| ---------------------- | -------- | ---------------------------------------------------------------------------------------------------------------- |
| `RESEND_API_KEY`       | Yes      | Resend API key (from Resend dashboard).                                                                          |
| `RESEND_FROM_EMAIL`    | No       | Sender address, e.g. `Bookings <bookings@yourdomain.com>`. Defaults to Resend’s onboarding address if unset.     |
| `NEXT_PUBLIC_SITE_URL` | No       | Base URL for the app (used for the “View bookings” link). Falls back to `VERCEL_URL` or `http://localhost:3000`. |

## Usage

Called from the booking submit API route only. No direct usage from the client.

```ts
import {
  sendBookingNotificationEmail,
  type BookingNotificationPayload,
} from '@/features/email';

const payload: BookingNotificationPayload = {
  customerName: formData.name,
  serviceName: formData.service,
  preferredDate: formData.preferredDate,
  preferredTimeWindow: formData.preferredTimeWindow,
};
const result = await sendBookingNotificationEmail(ownerEmail, payload);
if (result.sent) {
  // optional: update booking_requests.notification_sent
}
```

## Files

- `types.ts` – payload and result types.
- `bookingNotificationTemplate.ts` – subject line and HTML body.
- `sendBookingNotificationEmail.ts` – Resend send logic.

Shared by this feature: `../services/resendClient.ts`, `../utils/escapeHtml.ts`.
