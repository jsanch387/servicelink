# Contract: Mobile — Owner invoices

Shop bills the owner creates and sends. Table is `invoices` plus `invoice_line_items`. Feature map: [`src/features/invoices/docs/README.md`](../../src/features/invoices/docs/README.md).

This is **not** a job receipt. Completing a booking writes `booking_invoices` and uses [`mobile-booking-job-completed.md`](./mobile-booking-job-completed.md). Do not mix those rows into this list. Do not use `membership_invoices`.

**Reads** use the signed-in Supabase client. **Writes** go through the API below. Do not insert, update, or delete `invoices` or `invoice_line_items` from the app. That skips the invoice number, the public link, and the customer email and text.

**Implementation**

| Piece                       | Path                                                                                                        |
| --------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Save a new draft            | `POST /api/invoices` → `src/app/api/invoices/route.ts`                                                      |
| Update a draft              | `PATCH /api/invoices/[invoiceId]` → `src/app/api/invoices/[invoiceId]/route.ts`                             |
| Create or update, then send | `POST /api/invoices/send` → `src/app/api/invoices/send/route.ts`                                            |
| Mark a sent invoice paid    | `POST /api/invoices/[invoiceId]/paid` → `src/app/api/invoices/[invoiceId]/paid/route.ts`                    |
| Void a sent invoice         | `POST /api/invoices/[invoiceId]/void` → `src/app/api/invoices/[invoiceId]/void/route.ts`                    |
| Delete an invoice           | `DELETE /api/invoices/[invoiceId]` → `src/app/api/invoices/[invoiceId]/route.ts`                            |
| Send implementation         | `src/features/invoices/server/sendInvoice.ts`                                                               |
| Mark paid implementation    | `src/features/invoices/server/markInvoicePaid.ts`                                                           |
| Void implementation         | `src/features/invoices/server/voidInvoice.ts`                                                               |
| Delete implementation       | `src/features/invoices/server/deleteInvoice.ts`                                                             |
| Body validation             | `parseSaveInvoiceDraft` / `parseSendInvoiceDraft` in `src/features/invoices/utils/parseSaveInvoiceDraft.ts` |
| Table notes                 | `src/features/invoices/docs/INVOICES_TABLE.md`                                                              |

Do not call `GET /api/invoices` for the list. Select from Supabase.

---

## Authentication (writes)

| Header          | Value                                    |
| --------------- | ---------------------------------------- |
| `Authorization` | `Bearer <Supabase session access_token>` |
| `Content-Type`  | `application/json`                       |

The access token is the same JWT the Expo app already uses for other authenticated API routes.

**Behavior:** `getAuthenticatedUser` resolves Bearer or cookies. Mobile must send **Bearer**. The shop is the one the user owns (`invoices.write`). Do not send `businessId`. Team members get **403** `{ "success": false, "error": "Forbidden" }`.

A shop that is not Pro gets **403**:

```json
{
  "success": false,
  "error": "Invoices are a Pro feature. Upgrade to Pro to send invoices."
}
```

**Secrets:** Never send the Supabase service-role key from mobile. Only the anon key plus the user access token.

---

## List (direct read)

RLS lets the signed-in owner `SELECT` invoices for their shop (`business_profiles.profile_id = auth.uid()`). Active teammates can select too. The invoices screen is still owner-only: hide it unless the account is the owner and the shop is Pro. Those gates are not in RLS.

`businessId` is the current shop’s `business_profiles.id`.

```ts
const { data, error } = await supabase
  .from('invoices')
  .select(
    'id, status, customer_name, total_cents, due_on, created_at, invoice_number'
  )
  .eq('business_id', businessId)
  .order('created_at', { ascending: false });
```

Do not select `public_token` or `short_code` for the list. Do not read `invoice_line_items` here. Do not read `invoice_number_counters`.

| Column           | Type         | Show                                                                              |
| ---------------- | ------------ | --------------------------------------------------------------------------------- |
| `id`             | uuid         | Row key                                                                           |
| `status`         | text         | `draft` \| `sent` \| `paid` \| `void`                                             |
| `customer_name`  | text         | Trimmed, or `Untitled` if blank                                                   |
| `invoice_number` | int or null  | `#1001`, or `—` when null. Drafts have no number. Numbers start at 1001 when sent |
| `due_on`         | date or null | `Mon D, YYYY`. Parse `YYYY-MM-DD` at noon. Null → `No due date`                   |
| `total_cents`    | int ≥ 0      | USD (`cents / 100`)                                                               |
| `created_at`     | timestamptz  | Sort only. Do not display                                                         |

An empty shop is `data: []`. On `error`, show a retry.

Filters run in memory after the full list loads. They are not query params.

| Pill  | Rows                           |
| ----- | ------------------------------ |
| All   | Every status, including `void` |
| Draft | `draft`                        |
| Sent  | `sent`                         |
| Paid  | `paid`                         |

There is no Void pill. Void rows only show under All.

Empty copy:

| Filter | Title            | Body                                        |
| ------ | ---------------- | ------------------------------------------- |
| All    | No invoices yet  | Send your customer an invoice for the work. |
| Draft  | No drafts        | Invoices in this status will show up here.  |
| Sent   | No sent invoices | Invoices in this status will show up here.  |
| Paid   | No paid invoices | Invoices in this status will show up here.  |

---

## Open one invoice (direct read)

Load by `id` again. Do not reuse the list row. Filter by `id` and `business_id`.

```ts
const { data, error } = await supabase
  .from('invoices')
  .select('status')
  .eq('id', invoiceId)
  .eq('business_id', businessId)
  .maybeSingle();
```

| `status`               | Screen           |
| ---------------------- | ---------------- |
| `draft`                | Editor           |
| `sent`, `paid`, `void` | Bill             |
| no row, or `error`     | Back to the list |

A missing invoice and a failed read do the same thing: leave this screen and return to the list. There is no error page.

### Draft

```ts
const { data: invoice, error } = await supabase
  .from('invoices')
  .select(
    'id, status, customer_name, customer_email, customer_phone, note, due_on'
  )
  .eq('id', invoiceId)
  .eq('business_id', businessId)
  .maybeSingle();
```

Keep it only when `status === 'draft'` and `error` is null. Otherwise return to the list.

```ts
const { data: lines, error: lineError } = await supabase
  .from('invoice_line_items')
  .select('id, position, description, quantity, unit_amount_cents')
  .eq('invoice_id', invoiceId)
  .order('position', { ascending: true });
```

`lineError`, or a result that is not an array, returns to the list. Drafts do not select `amount_cents`. The line amount is `quantity * unit_amount_cents`.

### Bill (`sent`, `paid`, `void`)

```ts
const { data: invoice, error } = await supabase
  .from('invoices')
  .select(
    'id, status, invoice_number, customer_name, customer_email, customer_phone, due_on, note, total_cents'
  )
  .eq('id', invoiceId)
  .eq('business_id', businessId)
  .maybeSingle();
```

Return to the list when `error` is set, the row is missing, `status` is not `sent` / `paid` / `void`, or `invoice_number` is null.

```ts
const { data: lines, error: lineError } = await supabase
  .from('invoice_line_items')
  .select(
    'id, description, quantity, unit_amount_cents, amount_cents, position'
  )
  .eq('invoice_id', invoiceId)
  .order('position', { ascending: true });
```

`lineError`, or a result that is not an array, returns to the list.

The bill header name is `business_profiles.business_name` for this `business_id`. Empty → `Invoice`.

### Fields

Money is integer cents. Show USD with `cents / 100`.

| Screen label   | Column                                 | Type                         | Show                                                                            |
| -------------- | -------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------- |
| Billed to      | `invoices.customer_name`               | text, not null, default `''` | Trimmed name, or `—` if blank                                                   |
| Under the name | `invoices.customer_email`              | text, null                   | As stored. Hide when null or blank                                              |
| Under the name | `invoices.customer_phone`              | text, null                   | 10 digits stored on the invoice. Show `(XXX) XXX-XXXX`. Hide when null or blank |
| Due date       | `invoices.due_on`                      | date, null                   | `October 3, 2026`. Parse `YYYY-MM-DD` at noon. Null → `No due date`             |
| Notes          | `invoices.note`                        | text, null                   | Trimmed text under Notes. Hide the block when empty                             |
| Item           | `invoice_line_items.description`       | text, not null, default `''` | Trimmed text, or `Item` if blank                                                |
| Qty            | `invoice_line_items.quantity`          | int, not null, default `1`   | The integer                                                                     |
| Unit price     | `invoice_line_items.unit_amount_cents` | int, not null, default `0`   | USD                                                                             |
| Amount         | `invoice_line_items.amount_cents`      | int, not null, default `0`   | USD. Equals `quantity * unit_amount_cents`                                      |
| Sort           | `invoice_line_items.position`          | int, not null                | Not shown. Order ascending. `0` is the first line                               |

Email and phone live on `invoices`. They are copies. Do not join `customers`. `customer_id` can be null and is not used on this screen.

`invoices.subtotal_cents` and `invoices.total_cents` are both ints and are stored as the same number: the sum of line `amount_cents`. The bill does not select `subtotal_cents`. It prints `total_cents` twice:

| Label      | When   | Amount                                                                 |
| ---------- | ------ | ---------------------------------------------------------------------- |
| Subtotal   | always | `total_cents`                                                          |
| Amount due | `sent` | `total_cents`                                                          |
| Paid       | `paid` | `total_cents` (the full bill, not a payment applied against a balance) |
| Void       | `void` | `total_cents`                                                          |

The status pill says `Paid`, `Void`, or `Unpaid`. A `sent` bill is `Unpaid`.

There is no tax column, no discount column, and no amount paid or balance due. Do not subtract anything from `total_cents`. A booking discount, if there was one, was already taken off the line prices before the invoice was saved. `payment_method` and `paid_at` are not shown here.

---

## Request body

Save and send use the same JSON. Send also requires an email or a phone number.

```json
{
  "customerName": "Jane Doe",
  "customerEmail": "jane@example.com",
  "customerPhone": "5551234567",
  "dueDate": "2026-10-15",
  "note": "",
  "lines": [
    {
      "description": "Full detail",
      "quantity": "1",
      "amount": "150.00"
    }
  ]
}
```

| Field                 | Save draft | Send                  | Rules                                                                                                                                                |
| --------------------- | ---------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `customerName`        | yes        | yes                   | Trimmed, 1–120 characters                                                                                                                            |
| `customerEmail`       | no         | one of email or phone | Valid email, lowercased, max 254. `""` is fine when phone is set                                                                                     |
| `customerPhone`       | no         | one of email or phone | 10 US digits. A partial number is rejected                                                                                                           |
| `dueDate`             | no         | no                    | `YYYY-MM-DD`, or `""` for no due date                                                                                                                |
| `note`                | no         | no                    | Max 500 characters. Empty becomes null                                                                                                               |
| `lines`               | yes        | yes                   | 1–40 lines                                                                                                                                           |
| `lines[].description` | yes        | yes                   | Max 200 characters                                                                                                                                   |
| `lines[].quantity`    | yes        | yes                   | Whole-number string, at least `"1"`                                                                                                                  |
| `lines[].amount`      | yes        | yes                   | Dollar string, greater than 0, at most `$100,000`. `"150"` and `"150.00"` both work. This is not cents                                               |
| `invoiceId`           | no         | no                    | Send only. UUID of a draft to update, then send. Omit it to create a new invoice. A value that is not a UUID is ignored and a new invoice is created |
| `bookingId`           | no         | no                    | UUID of this shop’s appointment. Ignored when it is missing, cancelled, or not this shop’s booking                                                   |

A line with an empty description and an empty amount is skipped. Every kept line needs both a name and a price.

---

## Save a draft

Email and phone can both be empty.

|             |                                                        |
| ----------- | ------------------------------------------------------ |
| **Create**  | `POST /api/invoices`                                   |
| **Update**  | `PATCH /api/invoices/{invoiceId}`                      |
| **Success** | **200** — `{ "success": true, "invoiceId": "<uuid>" }` |

`PATCH` only updates a `draft`. A sent, paid, or void invoice returns **409** `{ "success": false, "error": "Only drafts can be edited." }`. An unknown id returns **404** `{ "success": false, "error": "Invoice not found." }`.

Validation failures are **400** with `error` set to the message to show. Other failures are **500** `{ "success": false, "error": "Could not save this draft." }`.

---

## Send

One call creates the invoice when `invoiceId` is omitted, or updates that draft when it is still a draft, then publishes it and notifies the customer.

|             |                      |
| ----------- | -------------------- |
| **Method**  | `POST`               |
| **Path**    | `/api/invoices/send` |
| **Success** | **200** — body below |

What the server does:

1. Insert a draft, or replace the existing draft’s customer, note, due date, and lines.
2. On the first send, assign `invoice_number` (from 1001), mint `short_code`, set `status` to `sent`, and set `sent_at`.
3. If `bookingId` points at an appointment that is already paid, mark this invoice `paid` and record `payment_method`. The customer email then says amount paid.
4. Email when `customerEmail` is set. Text when `customerPhone` is set. Either channel can fail without rolling the invoice back.

`shortUrl` is `{app origin}/b/{shortCode}`. The text is `{Business}: Your invoice is ready: {shortUrl}` plus the opt-out line. The email subject is `Invoice {number} from {business}` and includes the amount, due date, and the same link.

A second `POST` with the same `invoiceId` sends that link again. It does **not** edit a bill that is already `sent` or `paid`. The stored lines stay as they were. Void returns **409**.

**Success `200`:**

```json
{
  "success": true,
  "invoiceId": "uuid",
  "invoiceNumber": 1001,
  "shortUrl": "https://example.com/b/abc123",
  "emailAttempted": true,
  "emailSent": true,
  "emailError": null,
  "smsAttempted": true,
  "smsSent": true,
  "smsError": null
}
```

The invoice is already `sent` (or `paid`, when the linked appointment was already paid) when this returns, even if a channel fails.

| Delivery                                    | What to show                                                                                                                                        |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Neither attempted channel sent              | The error (`emailError` or `smsError`). The bill still exists. Call send again with the same `invoiceId` to resend. That does not mint a new number |
| One channel sent, the other failed          | Warning. Invoice texted / emailed, plus `emailError` or `smsError`                                                                                  |
| `emailAttempted` or `smsAttempted` is false | That contact was empty. Do not treat it as a failure                                                                                                |

`smsError` values:

| `smsError`                                       | Why                                 |
| ------------------------------------------------ | ----------------------------------- |
| `Too many texts. Try again in a little while.`   | Owner send rate limit               |
| `This customer opted out of texts.`              | Customer or carrier opt-out         |
| `Enter a valid phone number.`                    | Missing or invalid number           |
| `Texting is not available for this account yet.` | SMS is not configured for this shop |
| `Could not text this invoice.`                   | Any other send failure              |

**Errors**

| Status | When                                                                                                                                                |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `400`  | Validation. `error` is the message (`Add an email or a phone number.`, `Enter a valid email.`, and the other messages from `parseSaveInvoiceDraft`) |
| `401`  | Not signed in                                                                                                                                       |
| `403`  | Not the owner, or the shop is not Pro                                                                                                               |
| `404`  | `invoiceId` is a UUID this shop does not have                                                                                                       |
| `409`  | Void. `This invoice can no longer be sent.`                                                                                                         |
| `500`  | `Could not send this invoice.` If `invoiceId` is in the body, the draft may already exist. Retry send with that id                                  |

---

## Mark as paid

Off-app payment only: cash, a payment app, or other. Card checkout is a separate Stripe path. Do not send `card`.

Do not update `invoices` from the app. There is no insert or update policy for the signed-in user. The route uses the service role after it checks the owner, Pro, the method, and that the invoice is still `sent`.

Show **Mark as paid** only when `status` is `sent`. Hide it for `draft`, `paid`, and `void`.

The tap opens a required choice:

| `method`      | Label       |
| ------------- | ----------- |
| `cash`        | Cash        |
| `payment_app` | Payment app |
| `other`       | Other       |

Confirm stays disabled until one is selected.

|             |                                                        |
| ----------- | ------------------------------------------------------ |
| **Method**  | `POST`                                                 |
| **Path**    | `/api/invoices/{invoiceId}/paid`                       |
| **Success** | **200** — `{ "success": true, "invoiceId": "<uuid>" }` |

```json
{ "method": "cash" }
```

`invoiceId` is the invoice uuid. Do not send `businessId`. Auth is the same Bearer token as the other invoice writes.

What the server does:

1. Already `paid` → success. `paid_at` and `payment_method` stay as they are.
2. Not `sent` (draft or void) → **409** `{ "success": false, "error": "Only a sent invoice can be marked paid." }`.
3. Otherwise set `status` to `paid`, `paid_at` to now, and `payment_method` to the chosen method. Only a row that is still `sent` is updated.
4. Insert an owner notification (`customer_invoice_paid`) and send one Expo push. Both are best-effort. Do not write `notifications` from the app. Tap handling is in [`mobile-push-notifications.md`](./mobile-push-notifications.md): `reference_type` `invoice`, `reference_id` this invoice's id. A second paid event does not send another push.

On success, reload the bill from Supabase. The pill says `Paid`. The amount label is `Paid` and still shows `total_cents`. Do not show `payment_method` or `paid_at`.

**Errors.** Show `error`.

| Status | `error`                                                                        |
| ------ | ------------------------------------------------------------------------------ |
| `400`  | `Choose how this was paid.`                                                    |
| `401`  | Not signed in                                                                  |
| `403`  | `Forbidden`, or `Invoices are a Pro feature. Upgrade to Pro to send invoices.` |
| `404`  | `Invoice not found.`                                                           |
| `409`  | `Only a sent invoice can be marked paid.`                                      |
| `500`  | `Could not update this invoice.`                                               |

---

## Void

Do not update `invoices` from the app. Call the server. The route uses the service role after it checks the owner, Pro, and that the invoice is still `sent`.

Show **Void** only when `status` is `sent`. Hide it for `draft`, `paid`, and `void`.

The tap opens a confirm. Copy: `This bill stays on record. The link will show Void, and it can no longer be paid.` Buttons are `Cancel` and `Void invoice`.

|             |                                                        |
| ----------- | ------------------------------------------------------ |
| **Method**  | `POST`                                                 |
| **Path**    | `/api/invoices/{invoiceId}/void`                       |
| **Body**    | none                                                   |
| **Success** | **200** — `{ "success": true, "invoiceId": "<uuid>" }` |

`invoiceId` is the invoice uuid. Do not send `businessId`. Auth is the same Bearer token as the other invoice writes.

What the server does:

1. Already `void` → success. Nothing is rewritten.
2. Not `sent` (draft or paid) → **409** `{ "success": false, "error": "Only a sent invoice can be voided." }`.
3. Otherwise set `status` to `void`. The invoice number and the public link stay. Only a row that is still `sent` is updated.

No email, no text, and no notification.

On success, reload the bill from Supabase. The pill says `Void`. The amount label is `Void` and still shows `total_cents`. Hide **Mark as paid** and **Void**.

**Errors.** Show `error`.

| Status | `error`                                                                        |
| ------ | ------------------------------------------------------------------------------ |
| `401`  | Not signed in                                                                  |
| `403`  | `Forbidden`, or `Invoices are a Pro feature. Upgrade to Pro to send invoices.` |
| `404`  | `Invoice not found.`                                                           |
| `409`  | `Only a sent invoice can be voided.`                                           |
| `500`  | `Could not update this invoice.`                                               |

---

## Delete

Removes the invoice in any status: `draft`, `sent`, `paid`, or `void`. This is not void. The row and its line items are gone. The invoice number is not reused. A card charge is not refunded.

Do not delete `invoices` from the app. Call the server. The route uses the service role after it checks the owner and Pro.

Show **Delete** on a saved draft and on a sent, paid, or void bill. A new invoice that has not been saved yet has no id, so there is nothing to delete.

The tap opens a confirm. Copy: `This permanently removes the invoice and its lines. The customer link stops working. A card payment is not refunded.` Buttons are `Cancel` and `Delete invoice`.

|             |                                                        |
| ----------- | ------------------------------------------------------ |
| **Method**  | `DELETE`                                               |
| **Path**    | `/api/invoices/{invoiceId}`                            |
| **Body**    | none                                                   |
| **Success** | **200** — `{ "success": true, "invoiceId": "<uuid>" }` |

`invoiceId` is the invoice uuid. Do not send `businessId`. Auth is the same Bearer token as the other invoice writes.

What the server does:

1. Delete that shop’s invoice. `invoice_line_items` are removed with it.
2. Leave `invoice_number_counters` alone. The next send still uses the next number.
3. Leave the linked appointment alone.
4. Delete the owner notification whose `reference_type` is `invoice` and `reference_id` is this invoice. A failed notification delete does not restore the invoice.

On success, leave the bill and return to the invoice list. The public link no longer opens this bill.

**Errors.** Show `error`.

| Status | `error`                                                                        |
| ------ | ------------------------------------------------------------------------------ |
| `401`  | Not signed in                                                                  |
| `403`  | `Forbidden`, or `Invoices are a Pro feature. Upgrade to Pro to send invoices.` |
| `404`  | `Invoice not found.`                                                           |
| `500`  | `Could not delete this invoice.`                                               |

---

## Later

PDF and customer card checkout are separate owner or public routes. They are not part of this contract. Do not write `status`, `paid_at`, or `payment_method` from the app.
