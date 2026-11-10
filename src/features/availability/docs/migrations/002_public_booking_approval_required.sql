-- Public booking confirmation mode.
-- False (default): the customer is confirmed as soon as they finish booking.
-- True: the same flow is stored as a request the owner approves.
-- Already applied. Safe to re-run.

alter table public.business_availability
  add column if not exists public_booking_approval_required boolean not null default false;

comment on column public.business_availability.public_booking_approval_required is
  'When true, a finished public booking is a request the owner approves. False auto-confirms.';
