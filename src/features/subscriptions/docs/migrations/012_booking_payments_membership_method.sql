-- Allow membership/subscription-covered visits on booking_payments.
-- Without this, inserts with payment_method_selected = 'membership' fail the CHECK.

ALTER TABLE public.booking_payments
  DROP CONSTRAINT IF EXISTS booking_payments_payment_method_selected_check;

ALTER TABLE public.booking_payments
  ADD CONSTRAINT booking_payments_payment_method_selected_check
  CHECK (
    payment_method_selected = ANY (
      ARRAY[
        'none'::text,
        'pay_in_person'::text,
        'pay_now'::text,
        'membership'::text
      ]
    )
  );
