import type { QuoteCommunication } from '@/features/quotes/shared/quoteOutboundEvents';

export type QuoteActivityTimelineItem = {
  id: string;
  at: string;
  label: string;
};

function communicationLabel(event: QuoteCommunication): string {
  const channel = event.channel === 'sms' ? 'Text' : 'Email';
  return event.status === 'failed' ? `${channel} failed` : `${channel} sent`;
}

/**
 * Chronological owner timeline: created, viewed, then each email/SMS we sent.
 */
export function buildQuoteActivityTimeline(input: {
  createdAt: string;
  viewedAt: string | null;
  communications: readonly QuoteCommunication[];
}): QuoteActivityTimelineItem[] {
  const items: QuoteActivityTimelineItem[] = [];
  const createdAt = input.createdAt.trim();
  if (createdAt) {
    items.push({ id: 'created', at: createdAt, label: 'Created' });
  }

  const viewedAt = input.viewedAt?.trim() || '';
  if (viewedAt) {
    items.push({ id: 'viewed', at: viewedAt, label: 'Viewed' });
  }

  input.communications.forEach((event, index) => {
    const at = event.sentAt.trim();
    if (!at) return;
    items.push({
      id: `comm-${event.channel}-${event.type}-${index}`,
      at,
      label: communicationLabel(event),
    });
  });

  return items.sort((a, b) => {
    const delta = a.at.localeCompare(b.at);
    if (delta !== 0) return delta;
    return timelineItemRank(a.id) - timelineItemRank(b.id);
  });
}

function timelineItemRank(id: string): number {
  if (id === 'created') return 0;
  if (id === 'viewed') return 1;
  return 2;
}
