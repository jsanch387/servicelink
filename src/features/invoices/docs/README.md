# Invoices feature — developer reference

Shop bills the owner creates and sends. Keep this file updated when routes, statuses, or paid side effects change.

This is **not** a job receipt. Completing a booking writes `booking_invoices`. Membership billing writes `membership_invoices`. Do not mix those tables into this feature.

Mobile field rules: [`docs/contracts/mobile-invoices.md`](../../../../docs/contracts/mobile-invoices.md). Paid push tap: [`docs/contracts/mobile-push-notifications.md`](../../../../docs/contracts/mobile-push-notifications.md). Columns: [INVOICES_TABLE.md](./INVOICES_TABLE.md).

---

## Status

| Status  | Meaning                                                                       |
| ------- | ----------------------------------------------------------------------------- |
| `draft` | Editable. No invoice number, no public link.                                  |
| `sent`  | Published. Number and `/b/{shortCode}` exist. Customer can pay by card.       |
| `paid`  | Collected. The public bill says Paid.                                         |
| `void`  | Still on record. Number and link stay. The bill says Void and cannot be paid. |

Only a `sent` invoice can be marked paid or voided. Delete removes any status. The invoice number is not reused.

`payment_method` is `cash`, `payment_app`, `other`, or `card`, or null. Mark paid sets the first three. A linked appointment that is already settled can set `card` or one of the manual methods. Customer card checkout sets `status` and `paid_at` and leaves `payment_method` unchanged.

---

## Who can write

Signed-in users can `SELECT` invoices for a shop they own or actively belong to. There is no client insert, update, or delete policy. Every write uses the service role after the API checks the owner (`invoices.write`) and Pro.

---

## HTTP API

Auth for owner routes: `Authorization: Bearer <Supabase access token>` on mobile, or the dashboard session cookie. Do not send `businessId`.

| Method   | Path                             | What it does                                              |
| -------- | -------------------------------- | --------------------------------------------------------- |
| `POST`   | `/api/invoices`                  | Create a draft                                            |
| `PATCH`  | `/api/invoices/{invoiceId}`      | Replace a draft                                           |
| `POST`   | `/api/invoices/send`             | Create or update a draft, then send                       |
| `POST`   | `/api/invoices/{invoiceId}/paid` | Mark a sent invoice paid (`cash`, `payment_app`, `other`) |
| `POST`   | `/api/invoices/{invoiceId}/void` | Void a sent invoice                                       |
| `DELETE` | `/api/invoices/{invoiceId}`      | Delete the invoice and its lines                          |
| `GET`    | `/api/invoices/{invoiceId}/pdf`  | Download a sent, paid, or void bill                       |
| `POST`   | `/api/public/invoices/checkout`  | Start Stripe Checkout for a sent public bill              |

The list is a direct Supabase read. Do not use `GET /api/invoices` from mobile.

Send assigns `invoice_number` from 1001, mints `short_code`, and emails or texts `{origin}/b/{shortCode}`. If `bookingId` is an appointment this shop already collected, send marks the invoice paid in the same call.

---

## When an invoice becomes paid

`notifyOwnerInvoicePaid` runs after the row is paid. It inserts one `notifications` row (`type` `customer_invoice_paid`, `reference_type` `invoice`, `reference_id` the invoice id) and sends one Expo push with the same ids. Title is `Invoice paid`. Body is `{customer} · {amount}`, or the amount alone. A duplicate notice does not send a second push. A failed notice does not undo the payment.

Callers:

| Path                                              | When                                                                     |
| ------------------------------------------------- | ------------------------------------------------------------------------ |
| `server/markInvoicePaid.ts`                       | Owner marks a sent invoice paid                                          |
| `server/applyCustomerInvoiceCheckoutCompleted.ts` | Connect `checkout.session.completed`, `metadata.kind = customer_invoice` |
| `server/sendInvoice.ts`                           | Send finds the linked appointment already settled                        |
| `server/syncInvoiceWithBookingPayment.ts`         | A sent invoice is tied to a settled appointment                          |

Card checkout does not refund on delete. An in-flight Checkout session can still complete after the row is gone; the webhook then finds no invoice and does not recreate it.

---

## Web UI

| Screen                     | Behavior                                                                                                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/dashboard/invoices`      | Filter menu: All invoices, Draft, Sent, Paid. Void rows show under All. Each row opens the invoice. A three-dot menu deletes, and on a sent invoice also marks paid or voids.  |
| `/dashboard/invoices/new`  | Draft editor. Delete appears after the draft has an id.                                                                                                                        |
| `/dashboard/invoices/{id}` | Draft opens the editor. Sent, paid, and void open the bill. Trash icon deletes. The three-dot menu copies the link, downloads the PDF, and on a sent bill voids or marks paid. |
| `/b/{shortCode}`           | Customer bill. Pay starts Checkout when the invoice is sent and the shop can charge.                                                                                           |

Route constants live in `src/constants/routes.ts` (`ROUTES.DASHBOARD.INVOICES`, `API_ROUTES.INVOICE`, `INVOICE_MARK_PAID`, `INVOICE_VOID`, `INVOICE_PDF`, `getPublicBillPath`).

---

## Code map

| Path                                      | Role                                   |
| ----------------------------------------- | -------------------------------------- |
| `components/InvoicesDashboardPage.tsx`    | List, filter, empty states             |
| `components/InvoicesTable.tsx`            | Rows and the three-dot menu            |
| `components/CreateInvoiceScreen.tsx`      | Draft editor and send                  |
| `components/InvoiceBillScreen.tsx`        | Sent, paid, and void bill              |
| `components/InvoiceBillActions.tsx`       | Delete, link, PDF, void, mark paid     |
| `server/sendInvoice.ts`                   | Number, link, email, text              |
| `server/markInvoicePaid.ts`               | Manual paid                            |
| `server/voidInvoice.ts`                   | Void                                   |
| `server/deleteInvoice.ts`                 | Hard delete plus the paid notification |
| `server/createCustomerInvoiceCheckout.ts` | Public card Checkout                   |
| `server/notifyOwnerInvoicePaid.ts`        | Inbox row and Expo push                |
| `testing/`                                | Vitest for those server rules          |
