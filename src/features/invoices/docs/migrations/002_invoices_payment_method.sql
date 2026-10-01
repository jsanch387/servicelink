-- How an invoice was collected when the shop marks it paid off-app.
-- Card checkout can use 'card' later. Null until the invoice is paid that way.

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS payment_method text;

ALTER TABLE public.invoices
  DROP CONSTRAINT IF EXISTS invoices_payment_method_check;

ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_payment_method_check
  CHECK (
    payment_method IS NULL
    OR payment_method IN ('cash', 'payment_app', 'other', 'card')
  );

COMMENT ON COLUMN public.invoices.payment_method IS
  'How a paid invoice was collected: cash, payment_app, other, or card. Null until recorded.';
