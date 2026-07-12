# Marketing — flows & business rules (v1)

Authoritative product behavior for **promo codes** and **sales**. Implement server logic to match this doc.

---

## Access control (Pro)

| User state                                           | Marketing dashboard                                                  | Redemptions            |
| ---------------------------------------------------- | -------------------------------------------------------------------- | ---------------------- |
| **Pro** (`isProAccess`)                              | Full CRUD                                                            | Allowed                |
| **Free (never billed)**                              | Read-only or upgrade CTA (TBD UI)                                    | Not allowed            |
| **Lapsed Pro** (downgrade, cancel, `past_due`, etc.) | **Read-only** cards — view codes/sales, no create/edit/toggle/delete | **No new** redemptions |

Gate: dashboard routes, server actions, and public validate/apply APIs must check **`isProAccess`** for the business owner.

---

## Discount types

### Promo code

- Owner creates a code (e.g. `NEWUSER`, 20% off).
- Customer **enters at booking** (public flow first; owner booking optional in Phase 4).
- **One use per customer per code** — tracked at **completion** (not at booking create).
- Customer identity: **normalized phone first**; if missing, **normalized email**.
- Optional date range; otherwise always active while `is_active`.
- **Unique per business** (case-insensitive storage, uppercase display).
- **Editable while live** — changes apply to future validations; existing booking snapshots keep what was attached at book time unless rescheduled.

### Sale

- Owner runs **one active sale at a time** per business (enforce in app + DB).
- **Auto-applied at booking** when `is_active` and **appointment service date** falls in the sale window (`starts_at`/`ends_at` null = open-ended; otherwise inclusive calendar days).
- Dashboard badges (`scheduled` / `active` / `expired`) are **wall-clock** for Marketing UI only — booking apply uses the **service date**, so a sale that starts tomorrow still applies to appointments inside its window.
- Applies to **all services**.
- **No per-customer cap** on sales (time-boxed promotion).
- **Editable while live**.

---

## One discount per booking

Never stack promo code + sale on the same booking.

**Priority at booking time:**

1. **Valid entered promo code** (customer chose it).
2. Else **active sale** if service date qualifies.

Store a **discount snapshot** on the booking (source, id, type, value, estimated cents) for display and completion.

---

## When things happen

### At booking (public checkout)

1. Compute **subtotal** = service + add-ons (pre-discount).
2. Resolve discount (code entered OR auto-sale).
3. Show customer: label + estimated savings (e.g. “Summer Sale — 20% off at checkout”).
4. **Deposit** — calculate on **pre-discount subtotal** (existing deposit rules unchanged).
5. Persist booking + discount snapshot. **Do not** write redemption yet.

### At job completion (mobile / dashboard)

1. Recompute subtotal from final line items.
2. Re-validate discount:
   - **Honor rule:** If booking has a discount snapshot from book time and **service date still qualifies** for that code/sale window, **apply discount** even if owner deactivated the code/sale later that day.
   - **Reschedule:** If `scheduled_date` changed since book time, **re-run eligibility** on the new date (may gain, lose, or change discount).
3. Enforce **one use per customer per code** at redemption (phone → email).
4. Cap discount: `% ≤ 100`, fixed `≤ subtotal`, total never negative.
5. Show breakdown:

```
Subtotal
− Discount (Promo NEWUSER or Sale name)
= Adjusted total
− Deposit paid
= Amount to collect
```

6. Collection method (Tap to Pay, cash, external) — **same math**; only records how remainder was paid.
7. On confirmed completion — insert **`promo_code_redemptions`** row if source was promo.

---

## Validation rules

| Rule                     | Promo code             | Sale                               |
| ------------------------ | ---------------------- | ---------------------------------- |
| Unique code per business | Yes                    | N/A (name not unique)              |
| Max global uses          | **No** (v1)            | N/A                                |
| One per customer         | Yes                    | No                                 |
| % discount               | `0 < value ≤ 100`      | Same                               |
| Fixed discount           | `0 ≤ value ≤ subtotal` | Same                               |
| Timezone for dates       | Business TZ            | Business TZ                        |
| Active flag              | `is_active`            | `is_active` + only one active sale |

---

## Reschedule / rebook

When **`scheduled_date`** changes:

1. Re-run sale eligibility for **new** service date.
2. If customer had a **promo snapshot**, re-validate code (dates, active, not already redeemed).
3. Update booking discount snapshot or clear if no longer eligible.
4. Deposit already paid — **unchanged** (was on pre-discount basis at original book time unless product decides otherwise later).

---

## Owner-created bookings

- Same `POST /api/public/bookings` path (`ownerManualBooking: true` / `?for=owner`).
- **Promo codes are not accepted** on owner-created appointments (ignored if sent).
- **Active sale** auto-applies when `scheduledDate` qualifies (same window rules as public).
- Server recomputes the discount snapshot from DB — client preview fields are not trusted.
- No `promo_code_redemptions` for sales.

---

## Quotes

**Out of scope for v1.** Reuse discount engine later.

---

## Dashboard flows

### List (`/dashboard/marketing`)

- Tabs: Promo codes | Sales.
- Toggle active, edit, delete (with confirm — TBD UI).
- Pro: full access. Lapsed: read-only.

### Create promo (`/dashboard/marketing/promo-codes/new`)

- Essentials: code, discount, active toggle.
- More options: note, optional date range, one-use-per-customer (default on).
- Success screen: copy code, share message.
- **No max uses** in v1 UI.

### Create sale (`/dashboard/marketing/sales/new`)

- Essentials: name, discount, start/end dates, active toggle.
- More options: note only.
- Success screen: auto-apply explanation.

### Edit (TBD routes)

- `/dashboard/marketing/promo-codes/[id]/edit`
- `/dashboard/marketing/sales/[id]/edit`
- Reuse create form in edit mode.

---

## API surface (planned)

| Endpoint / action                                                          | Purpose                              |
| -------------------------------------------------------------------------- | ------------------------------------ |
| `listPromoCodes`, `listSales`                                              | Dashboard                            |
| `createPromoCode`, `updatePromoCode`, `togglePromoCode`, `deletePromoCode` | Owner CRUD                           |
| `createSale`, `updateSale`, `toggleSale`, `deleteSale`                     | Owner CRUD (enforce one active sale) |
| `POST /api/public/bookings` (extend)                                       | Attach discount snapshot at create   |
| `validatePromoCode` (internal or public)                                   | Booking + completion                 |
| `resolveSaleForDate` (internal)                                            | Booking + completion                 |
| Completion handler (mobile contract)                                       | Breakdown + redemption               |

---

## Edge cases (decided)

| Scenario                                                  | Behavior                                                         |
| --------------------------------------------------------- | ---------------------------------------------------------------- |
| Owner deactivates code/sale after book, before completion | **Honor** if service date still qualifies                        |
| Fixed discount > subtotal                                 | Cap at subtotal                                                  |
| 100% off                                                  | Allowed (adjusted total $0; deposit handling per existing rules) |
| Duplicate code on create                                  | Reject                                                           |
| Second active sale                                        | Reject or auto-deactivate previous (pick one at implement time)  |
| Customer no phone and no email                            | Cannot redeem promo (require at least one for one-time use)      |
| Pro downgrade with existing scheduled discounted bookings | Complete with snapshot honor rules; no new marketing CRUD        |

---

## Changelog

When implementing, update [README.md](./README.md) status table and [DATABASE.md](./DATABASE.md) if schema changes.
