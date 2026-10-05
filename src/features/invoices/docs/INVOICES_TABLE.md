# Invoices tables

Bills a shop creates and sends. This is separate from `booking_invoices` and `membership_invoices`.

Behavior, routes, and the paid notification: [README.md](./README.md).

## Tables

| Table                     | Purpose                                                                      |
| ------------------------- | ---------------------------------------------------------------------------- |
| `invoices`                | One bill. Draft, sent, paid, or void.                                        |
| `invoice_line_items`      | Lines on that bill. Removed when the invoice is deleted.                     |
| `invoice_number_counters` | Next human invoice number per business, starting at 1001. Service role only. |

`invoices.business_id` → `business_profiles(id)` on delete cascade. `booking_id` and `customer_id` set null when that row is deleted. Deleting an invoice does not delete the appointment.

Customer name, email, and phone are copied onto the bill. `due_on` empty means due on receipt. `invoice_number` and `short_code` stay empty until send. `public_token` is the secret for the customer link. `short_code` is the public `/b/{code}` path.

Line `amount_cents` must equal `quantity * unit_amount_cents`. `subtotal_cents` and `total_cents` store that same sum.

## `invoices` columns

| Column               | Notes                                                                   |
| -------------------- | ----------------------------------------------------------------------- |
| `id`                 | uuid                                                                    |
| `business_id`        | Shop                                                                    |
| `created_by_user_id` | Owner who created it. Null if that user is deleted.                     |
| `customer_id`        | Optional copy source. The bill does not join `customers`.               |
| `booking_id`         | Optional appointment. Empty when the job was never booked.              |
| `invoice_number`     | Integer from 1001, or null while draft. Not reused after delete.        |
| `status`             | `draft`, `sent`, `paid`, `void`                                         |
| `customer_name`      | Text, default `''`                                                      |
| `customer_email`     | Text or null                                                            |
| `customer_phone`     | 10 digits or null                                                       |
| `note`               | Text or null                                                            |
| `currency`           | Text, USD in the product                                                |
| `due_on`             | Date or null. Parse `YYYY-MM-DD` at noon.                               |
| `subtotal_cents`     | Int, same as `total_cents`                                              |
| `total_cents`        | Int. The bill prints this as subtotal and as the amount.                |
| `public_token`       | Secret. Do not select it for the owner list.                            |
| `short_code`         | Public link code, or null until send.                                   |
| `sent_at`            | Set on first send                                                       |
| `paid_at`            | Set when the invoice becomes paid. Not shown on the bill.               |
| `voided_at`          | On the table. The void route does not write it; it only sets `status`.  |
| `payment_method`     | `cash`, `payment_app`, `other`, `card`, or null. Not shown on the bill. |
| `created_at`         | Sort key for the list. Not displayed.                                   |
| `updated_at`         | Row timestamp                                                           |

`payment_method` check: [`migrations/002_invoices_payment_method.sql`](./migrations/002_invoices_payment_method.sql).

## Access

Authenticated users can select invoices for a shop they own or actively belong to. Inserts, updates, and deletes go through the service role after the owner and Pro checks. `invoice_number_counters` has no client access.

The create-table script is not in this folder. `002_invoices_payment_method.sql` is the payment-method change.
