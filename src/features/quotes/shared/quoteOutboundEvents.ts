export const QUOTE_OUTBOUND_CHANNELS = ['email', 'sms'] as const;
export type QuoteOutboundChannel = (typeof QUOTE_OUTBOUND_CHANNELS)[number];

export const QUOTE_OUTBOUND_TYPES = ['quote_reminder'] as const;
export type QuoteOutboundType = (typeof QUOTE_OUTBOUND_TYPES)[number];

export const QUOTE_OUTBOUND_STATUSES = ['sent', 'failed'] as const;
export type QuoteOutboundStatus = (typeof QUOTE_OUTBOUND_STATUSES)[number];

/** One customer email or SMS we sent for a quote. */
export type QuoteCommunication = {
  channel: QuoteOutboundChannel;
  type: QuoteOutboundType;
  status: QuoteOutboundStatus;
  sentAt: string;
  toAddress: string | null;
};

export function isQuoteOutboundChannel(
  value: string
): value is QuoteOutboundChannel {
  return (QUOTE_OUTBOUND_CHANNELS as readonly string[]).includes(value);
}

export function isQuoteOutboundType(value: string): value is QuoteOutboundType {
  return (QUOTE_OUTBOUND_TYPES as readonly string[]).includes(value);
}

export function isQuoteOutboundStatus(
  value: string
): value is QuoteOutboundStatus {
  return (QUOTE_OUTBOUND_STATUSES as readonly string[]).includes(value);
}
