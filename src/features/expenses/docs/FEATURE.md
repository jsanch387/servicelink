# Expenses

Shop costs the owner records by hand. Phone and web read and write the same rows in `public.business_expenses`. This page is the list, not a profit or revenue report.

## Where it lives

| Surface   | Location                                                                           |
| --------- | ---------------------------------------------------------------------------------- |
| Dashboard | `/dashboard/expenses` (`ROUTES.DASHBOARD.EXPENSES`)                                |
| Page      | `src/app/dashboard/expenses/page.tsx`                                              |
| API       | `GET` and `POST` `/api/expenses`, `PATCH` and `DELETE` `/api/expenses/[expenseId]` |
| Feature   | `src/features/expenses/`                                                           |

Nav sits in the Money group, after Invoices: Payments, Invoices, Expenses, Subscriptions. It requires onboarding and `expenses.read`. The page title is Expenses.

`expenses.read` and `expenses.write` belong to the owner only. Members and managers do not see the page. Permission notes: `src/features/team/docs/TEAM_FEATURE.md`.

## What the screen does

The owner adds, edits, and removes expenses. The list is a table on desktop and cards on a phone. A row opens the edit form. Remove asks for confirmation, then hard-deletes the row.

Two summary cards sit above the list:

- The first card is the selected month, or **This month** when no month is chosen.
- The second card is that calendar year. The label is **This year** when it is the current year, otherwise the year number.

A category filter narrows both cards and the list. A month filter narrows the list and moves the first card to that month. The year card stays the full year for the category. Totals count every matching expense. They do not follow the page.

Filters sit on the right above the list. The month control is a year switcher and a 12-month grid. **All months** clears it. The category control is a menu labeled Filter. Months before January 2000 and more than one year ahead are disabled, matching the save rules.

The list shows 10 expenses per page, with Previous and Next once there is a second page. Changing the month or category returns to page 1. The browser still loads the full list; paging is only in the UI.

A new expense opens on today’s date and the Supplies category. The owner picks the date. Past dates are allowed so a forgotten charge can be filed in an earlier month.

## Save rules

The API checks the body in `parseExpense.ts`. The database checks are looser. Keep the web rules here. Do not add them as new table constraints, or the phone can no longer save a row the table used to accept.

| Field       | Web rule                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `name`      | Required, trimmed, 1–40 characters                                                                                             |
| `amount`    | Dollars string. Stored as cents with `Math.round(dollars * 100)`. Greater than $0 and at most $1,000,000 (`100_000_000` cents) |
| `category`  | `supplies`, `fuel`, `equipment`, `insurance`, or `other`                                                                       |
| `chargedOn` | Real `YYYY-MM-DD` from `2000-01-01` through one year after today                                                               |

Amounts display with cents (`Intl` USD). The form default category is Supplies. The table default, used when a client omits category, is `other`.

A 400 returns the validation message on the form. A failed save or a network error shows “Could not save this expense.” and leaves the button usable. Remove uses the same pattern.

## API

Auth is the signed-in Supabase user (`getAuthenticatedUser`). The route then requires `expenses.read` or `expenses.write`. Writes use that user client, never the service role. `business_id` comes from the permission check, not the request body.

List body is not used. `GET /api/expenses` returns:

```json
{ "success": true, "expenses": [] }
```

Each expense is `{ id, name, amountCents, category, chargedOn }`. Rows with an unknown category, a bad date, or a non-positive amount are dropped. Order is `charged_on` descending, then `created_at` descending.

Create and update body:

```json
{
  "name": "Gas",
  "amount": "42.50",
  "category": "fuel",
  "chargedOn": "2026-09-14"
}
```

`POST` returns `{ "success": true, "expenseId": "<uuid>" }`. `PATCH` and `DELETE` return `{ "success": true }`. The id in the path must be a UUID. Update and delete match `id` and `business_id`. A missing row is 404.

Insert writes `business_id`, `name`, `amount_cents`, `charged_on`, `category`, and `created_by`. Update writes only name, amount, date, and category.

The hand-written `Database` type does not satisfy the Supabase schema generic, so insert and update payloads are cast `as never` in `mutateExpense.ts`. Returned ids are read from the selected row.

## Database: `public.business_expenses`

The table already exists. Do not recreate it.

| Column         | Type          | Notes                                                                                   |
| -------------- | ------------- | --------------------------------------------------------------------------------------- |
| `id`           | `uuid`        | Primary key, `gen_random_uuid()`                                                        |
| `business_id`  | `uuid`        | Required. FK → `business_profiles(id)` on delete cascade                                |
| `name`         | `text`        | Required. Trimmed length 1–40                                                           |
| `amount_cents` | `integer`     | Required. Must be greater than 0                                                        |
| `charged_on`   | `date`        | Required. The day the shop was charged                                                  |
| `category`     | `text`        | Required. Default `other`. One of `supplies`, `fuel`, `insurance`, `equipment`, `other` |
| `created_by`   | `uuid`        | Nullable. FK → `auth.users(id)` on delete set null                                      |
| `created_at`   | `timestamptz` | Default `now()`                                                                         |
| `updated_at`   | `timestamptz` | Default `now()`. Set on update by `trg_business_expenses_set_updated_at`                |

Index: `business_expenses_business_charged_on_idx` on `(business_id, charged_on desc)`.

RLS is enabled. Select, insert, update, and delete each require `auth_owns_business(business_id)` (`business_expenses_select_owner`, `_insert_owner`, `_update_owner`, `_delete_owner`).

There is no notes column, receipt, or soft delete.

## Tests

`src/features/expenses/testing/parseExpense.test.ts` covers parsing, period totals, category and month filtering, and the 10-row page split.
