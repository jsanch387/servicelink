# Why `bookings.customer_id` matters

## What it is

Each row in `bookings` can store a **`customer_id`**: a UUID that points at one row in **`customers`** for the same business.

The app flow is:

1. **`upsertCustomerForBooking`** finds or creates a `customers` row (match by phone, then email).
2. **`createBooking`** inserts into `bookings` and sets **`customer_id`** to that customer’s id.

So the booking is explicitly tied to the CRM customer record.

## What goes wrong if the column is missing

Inserts go through **Supabase PostgREST** (the REST API). If **`bookings` has no `customer_id` column**, PostgREST **ignores** that field on insert. The booking row is created **without** a link.

The code now selects `id, customer_id` after insert and **throws** if `customer_id` is missing, so you get a clear error instead of silent “bookings with no customer.”

## What you need in production

1. Run **`002_bookings_customer_id.sql`** (in this folder) so `bookings.customer_id` exists and references `customers(id)`.
2. Use the **service role** (admin) client on server routes that create bookings; it **bypasses RLS** so inserts into `customers` and `bookings` succeed when policies would block anon users.

## Service role vs “PostgREST dropped the field”

- **RLS blocking** the insert usually returns an error from Supabase, not a silent omit.
- **Unknown column** means the field never existed in the table definition, so the link cannot be stored until you add the column.

If you are unsure, check **Table Editor → `bookings` → Columns** for `customer_id`.
