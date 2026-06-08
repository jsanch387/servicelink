import { parseServiceDescriptionLines } from '@/features/business-profile/utils/serviceDescriptionDisplay';
import React from 'react';

export interface ServiceDescriptionFormattedProps {
  description: string | null | undefined;
  className?: string;
}

/**
 * Renders service descriptions with hanging-indent bullets so wrapped lines
 * align with the first line of text, not under the bullet glyph.
 */
export function ServiceDescriptionFormatted({
  description,
  className = '',
}: ServiceDescriptionFormattedProps) {
  const lines = parseServiceDescriptionLines(description ?? '');
  if (!description?.trim()) return null;

  return (
    <div className={`space-y-1 ${className}`.trim()}>
      {lines.map((line, index) => {
        if (line.kind === 'empty') {
          return (
            <div key={`empty-${index}`} className="h-[0.65em]" aria-hidden />
          );
        }

        if (line.kind === 'bullet') {
          return (
            <div
              key={`bullet-${index}`}
              className="grid grid-cols-[auto_1fr] gap-x-2.5 items-start"
            >
              <span
                className="shrink-0 select-none leading-relaxed"
                aria-hidden
              >
                •
              </span>
              <span className="min-w-0 leading-relaxed break-words">
                {line.text}
              </span>
            </div>
          );
        }

        return (
          <p key={`text-${index}`} className="m-0 leading-relaxed break-words">
            {line.text}
          </p>
        );
      })}
    </div>
  );
}
