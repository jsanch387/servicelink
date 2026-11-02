-- Known appointment origins on bookings.booking_source.
-- Null remains valid for legacy rows created before origin was required.

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_booking_source_check;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_booking_source_check
  CHECK (
    booking_source IS NULL
    OR booking_source = ANY (
      ARRAY[
        'owner'::text,
        'public'::text,
        'quote'::text,
        'subscription'::text
      ]
    )
  );
