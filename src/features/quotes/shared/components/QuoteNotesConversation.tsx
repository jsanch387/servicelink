import React from 'react';

export type QuoteNotesConversationProps = {
  customerNote?: string | null;
  businessNote?: string | null;
  customerLabel: string;
  businessLabel: string;
  /** Whose messages sit on the right, like a chat thread. */
  viewer: 'customer' | 'owner';
  className?: string;
};

function NoteBubble({
  align,
  label,
  text,
}: {
  align: 'left' | 'right';
  label: string;
  text: string;
}) {
  const isRight = align === 'right';

  return (
    <div
      className={`max-w-[90%] ${isRight ? 'ml-auto text-right' : ''}`}
      role="listitem"
    >
      <p className="mb-1 px-0.5 text-[11px] font-medium text-gray-500">
        {label}
      </p>
      <div
        className={`rounded-2xl bg-white/[0.07] px-3.5 py-2.5 text-left text-gray-200 ring-1 ring-inset ring-white/10 ${
          isRight ? 'rounded-br-md' : 'rounded-bl-md'
        }`}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

/**
 * Customer request + owner reply as a short chat thread.
 * Used on public `/q/[token]`, owner quote review, and quote detail.
 */
export function QuoteNotesConversation({
  customerNote,
  businessNote,
  customerLabel,
  businessLabel,
  viewer,
  className = '',
}: QuoteNotesConversationProps) {
  const customer = customerNote?.trim() ?? '';
  const business = businessNote?.trim() ?? '';
  if (!customer && !business) return null;

  return (
    <div
      className={`space-y-3.5 ${className}`.trim()}
      role="list"
      aria-label="Quote notes"
    >
      {customer ? (
        <NoteBubble
          align={viewer === 'customer' ? 'right' : 'left'}
          label={customerLabel}
          text={customer}
        />
      ) : null}
      {business ? (
        <NoteBubble
          align={viewer === 'owner' ? 'right' : 'left'}
          label={businessLabel}
          text={business}
        />
      ) : null}
    </div>
  );
}
