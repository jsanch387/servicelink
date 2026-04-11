# Quote sent to customer (email)

When an owner completes **Send quote** in the dashboard, the customer receives an email with a **Review quote** button linking to the public URL (`/q/{token}`).

## Flow

1. `POST /api/quotes/send` creates the quote, `quote_public_links`, and builds `publicUrl`.
2. This feature sends email to **`customerEmail`** via Resend.
3. If sending fails (missing API key, Resend error), the API still returns **201**; the error is logged server-side (same pattern as booking emails).

## Environment

Same as other transactional email: `RESEND_API_KEY`, optional `RESEND_FROM_EMAIL`, `NEXT_PUBLIC_SITE_URL` for link origin.

## Template

Layout matches the **customer** branch of **`availability-booking-notification/availabilityBookingNotificationTemplate.ts`**: outer wrapper, hero headline, gray **Quote summary** card, white **Service & pricing** card, optional **Message** block for notes, full-width **Review quote** button, ServiceLink footer.
