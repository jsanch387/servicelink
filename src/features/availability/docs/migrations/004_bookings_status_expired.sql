-- Appointment requests whose day has passed use bookings.status = 'expired'.
-- Already applied. Safe to re-run.

alter table public.bookings drop constraint if exists bookings_status_check;

alter table public.bookings
  add constraint bookings_status_check
  check (
    status = any (
      array[
        'requested'::text,
        'confirmed'::text,
        'completed'::text,
        'cancelled'::text,
        'expired'::text
      ]
    )
  );
