-- Capture marketplace (or future channels) when a customer requests a quote.
-- Copied onto bookings.referral_source when the quote becomes an appointment.

ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS referral_source text;

COMMENT ON COLUMN public.quotes.referral_source IS
  'Acquisition channel captured at public quote-request time, e.g. marketplace. Copied to bookings.referral_source when the quote becomes an appointment.';
