import type { QuoteActivityTimelineItem } from '../utils/buildQuoteActivityTimeline';
import { formatQuoteDetailDateTime } from '../utils/quoteDetailFormat';

interface QuoteActivityTimelineProps {
  items: readonly QuoteActivityTimelineItem[];
}

export function QuoteActivityTimeline({ items }: QuoteActivityTimelineProps) {
  if (items.length === 0) return null;

  return (
    <ol className="space-y-0">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <li
            key={item.id}
            className="grid grid-cols-[12px_minmax(0,1fr)] gap-x-3"
          >
            <div className="relative">
              <span
                className="absolute left-1/2 top-1.5 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-gray-400"
                aria-hidden
              />
              {isLast ? null : (
                <span
                  className="absolute bottom-0 left-1/2 top-3.5 w-px -translate-x-1/2 bg-white/10"
                  aria-hidden
                />
              )}
            </div>
            <div
              className={`flex min-w-0 items-start justify-between gap-4 ${isLast ? 'pb-0' : 'pb-4'}`}
            >
              <p className="text-sm font-medium text-gray-200">{item.label}</p>
              <p className="text-right text-sm text-gray-400">
                {formatQuoteDetailDateTime(item.at)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
