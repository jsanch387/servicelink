-- Link outbound SMS to the quote (same idea as booking_id).
ALTER TABLE public.sms_messages
  ADD COLUMN IF NOT EXISTS quote_id uuid REFERENCES public.quotes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sms_messages_quote_id
  ON public.sms_messages (quote_id)
  WHERE quote_id IS NOT NULL;

COMMENT ON COLUMN public.sms_messages.quote_id IS
  'Quote this SMS belongs to (e.g. quote_reminder). Null for booking/other SMS.';

-- Owner-readable timeline for email + SMS on a quote.
CREATE TABLE IF NOT EXISTS public.quote_outbound_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('email', 'sms')),
  type text NOT NULL,
  status text NOT NULL CHECK (status IN ('sent', 'failed')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  to_address text,
  sms_message_id uuid REFERENCES public.sms_messages(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (quote_id, channel, type)
);

CREATE INDEX IF NOT EXISTS quote_outbound_events_quote_sent_at_idx
  ON public.quote_outbound_events (quote_id, sent_at);

COMMENT ON TABLE public.quote_outbound_events IS
  'Customer email/SMS we sent for a quote. One row per channel+type (e.g. reminder email, reminder SMS).';

ALTER TABLE public.quote_outbound_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS quote_outbound_events_owner_select ON public.quote_outbound_events;
CREATE POLICY quote_outbound_events_owner_select
  ON public.quote_outbound_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.business_profiles bp
      WHERE bp.id = quote_outbound_events.business_id
        AND bp.profile_id = auth.uid()
    )
  );

GRANT SELECT ON public.quote_outbound_events TO authenticated;
GRANT ALL ON public.quote_outbound_events TO service_role;
