# Invoices tables

Bills a shop creates and sends. This is separate from `booking_invoices`.

`booking_invoices` is the paid receipt written when a booking is marked complete. Leave that table and the job-complete flow alone.

## Tables

| Table                     | Purpose                                                                      |
| ------------------------- | ---------------------------------------------------------------------------- |
| `invoices`                | One bill. Draft, sent, paid, or void.                                        |
| `invoice_line_items`      | Lines on that bill.                                                          |
| `invoice_number_counters` | Next human invoice number per business, starting at 1001. Service role only. |

`invoices.business_id` → `business_profiles(id)` on delete cascade.

Customer name, email, and phone are copied onto the bill. `customer_id` is optional. `booking_id` is optional and stays empty for a job that was never booked.

`due_on` empty means due on receipt. `invoice_number` stays empty until the bill is sent. `public_token` is the secret for the customer link.

Line `amount_cents` must equal `quantity * unit_amount_cents`.

## Access

Authenticated users can select invoices for a shop they own or actively belong to. Inserts and updates go through the service role. `invoice_number_counters` has no client access.

Migration: [`migrations/001_invoices.sql`](./migrations/001_invoices.sql).
