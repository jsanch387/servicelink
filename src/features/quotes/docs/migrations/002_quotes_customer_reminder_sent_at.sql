-- One-shot customer nudge after a sent quote sits unanswered.
-- Claimed before email/SMS so the daily cron never double-sends.

ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS customer_reminder_sent_at timestamptz;

COMMENT ON COLUMN public.quotes.customer_reminder_sent_at IS
  'When we emailed/texted the customer a one-time nudge for an unanswered sent quote. Null means not reminded yet.';

CREATE INDEX IF NOT EXISTS quotes_customer_reminder_pending_idx
  ON public.quotes (sent_at)
  WHERE customer_reminder_sent_at IS NULL
    AND status IN ('sent', 'viewed');
