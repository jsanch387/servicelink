'use client';

import React, { type ReactNode } from 'react';

/** Inline: `**bold**` and `$1,234` amounts. */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }
    const token = match[0];
    const body =
      token.startsWith('**') && token.endsWith('**')
        ? token.slice(2, -2)
        : token;
    nodes.push(
      <strong key={`${keyPrefix}-b-${key}`} className="font-semibold text-white">
        {body}
      </strong>
    );
    key += 1;
    last = match.index + token.length;
  }

  if (last < text.length) {
    nodes.push(text.slice(last));
  }

  return nodes;
}

function isBullet(line: string): boolean {
  return /^[-*•]\s+/.test(line);
}

function isNumbered(line: string): boolean {
  return /^\d+[.)]\s+/.test(line);
}

function isHeading(line: string): boolean {
  return /^#{1,6}\s+\S/.test(line);
}

function stripListMarker(line: string): string {
  return line.replace(/^([-*•]|\d+[.)])\s+/, '');
}

function stripHeadingMarkers(line: string): string {
  return line.replace(/^#{1,6}\s+/, '').trim();
}

/**
 * Flat assistant reply (no bubble). Handles paragraphs, lists, headings, and light markdown.
 */
export function AssistantReplyText({ text }: { text: string }) {
  const blocks = text
    .replace(/\r\n/g, '\n')
    .trim()
    .split(/\n{2,}/)
    .filter(Boolean);

  return (
    <div className="grid w-full gap-3 text-[15px] leading-6 text-white/85">
      {blocks.map((block, blockIndex) => {
        const lines = block.split('\n').map(line => line.trimEnd());
        const listLines = lines.filter(line => line.trim().length > 0);
        const allBullets =
          listLines.length > 0 && listLines.every(line => isBullet(line.trim()));
        const allNumbered =
          listLines.length > 0 &&
          listLines.every(line => isNumbered(line.trim()));

        if (allBullets || allNumbered) {
          const ListTag = allNumbered ? 'ol' : 'ul';
          return (
            <ListTag
              key={`block-${blockIndex}`}
              className={
                allNumbered
                  ? 'list-decimal space-y-1.5 pl-5'
                  : 'list-disc space-y-1.5 pl-5'
              }
            >
              {listLines.map((line, lineIndex) => (
                <li key={`li-${blockIndex}-${lineIndex}`}>
                  {renderInline(
                    stripListMarker(line.trim()),
                    `${blockIndex}-${lineIndex}`
                  )}
                </li>
              ))}
            </ListTag>
          );
        }

        const onlyHeading =
          listLines.length === 1 && isHeading(listLines[0]!.trim());
        if (onlyHeading) {
          return (
            <p
              key={`block-${blockIndex}`}
              className="text-[15px] font-semibold leading-6 text-white"
            >
              {renderInline(
                stripHeadingMarkers(listLines[0]!.trim()),
                `${blockIndex}-h`
              )}
            </p>
          );
        }

        return (
          <div key={`block-${blockIndex}`} className="grid gap-2">
            {lines.map((line, lineIndex) => {
              const trimmed = line.trim();
              if (!trimmed) return null;
              if (isHeading(trimmed)) {
                return (
                  <p
                    key={`h-${blockIndex}-${lineIndex}`}
                    className="text-[15px] font-semibold leading-6 text-white"
                  >
                    {renderInline(
                      stripHeadingMarkers(trimmed),
                      `${blockIndex}-${lineIndex}`
                    )}
                  </p>
                );
              }
              return (
                <p
                  key={`p-${blockIndex}-${lineIndex}`}
                  className="whitespace-pre-wrap"
                >
                  {renderInline(trimmed, `${blockIndex}-${lineIndex}`)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
