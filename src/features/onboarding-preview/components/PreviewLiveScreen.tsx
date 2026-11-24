'use client';

import { Button } from '@/components/shared';
import { useState } from 'react';
import { bookingLinkLabel } from '../slugPreview';
import { PreviewActionBar } from './PreviewActionBar';

const CONFETTI = [
  { left: '6%', delay: '0ms', drift: '-8px', color: 'bg-white' },
  { left: '14%', delay: '40ms', drift: '10px', color: 'bg-emerald-300' },
  { left: '24%', delay: '90ms', drift: '-6px', color: 'bg-white/80' },
  { left: '33%', delay: '20ms', drift: '12px', color: 'bg-amber-200' },
  { left: '44%', delay: '120ms', drift: '-10px', color: 'bg-white' },
  { left: '54%', delay: '60ms', drift: '8px', color: 'bg-emerald-200' },
  { left: '64%', delay: '140ms', drift: '-12px', color: 'bg-white/70' },
  { left: '74%', delay: '30ms', drift: '6px', color: 'bg-amber-100' },
  { left: '84%', delay: '100ms', drift: '-8px', color: 'bg-white' },
  { left: '92%', delay: '70ms', drift: '10px', color: 'bg-emerald-300' },
];

interface PreviewLiveScreenProps {
  compact: boolean;
  slug: string;
  onBookTest: () => void;
  onSkip: () => void;
}

export function PreviewLiveScreen({
  compact,
  slug,
  onBookTest,
  onSkip,
}: PreviewLiveScreenProps) {
  const [copied, setCopied] = useState(false);
  const label = bookingLinkLabel(slug);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`https://${label}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="onboarding-preview-rise relative">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-28 overflow-hidden"
        aria-hidden
      >
        {CONFETTI.map(piece => (
          <span
            key={piece.left}
            className={`onboarding-preview-confetti absolute top-0 h-2 w-1.5 rounded-sm ${piece.color}`}
            style={{
              left: piece.left,
              animationDelay: piece.delay,
              ['--confetti-drift' as string]: piece.drift,
            }}
          />
        ))}
      </div>

      <h1
        className={
          compact
            ? 'text-2xl font-bold tracking-tight text-white'
            : 'text-xl font-bold tracking-tight text-white sm:text-2xl md:text-3xl'
        }
      >
        You&apos;re live! 🎉
      </h1>
      <p className="mt-2 text-sm text-white/60 sm:text-base">
        Your booking page is ready to take bookings.
      </p>

      <div className="mt-6 flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-white">
          {label}
        </p>
        <Button type="button" variant="secondary" size="sm" onClick={copy}>
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>

      <section className="mt-4 rounded-[10px] border border-white/[0.08] bg-white/[0.03] p-4">
        <h2 className="text-base font-semibold tracking-tight text-white">
          See what your customers see.
        </h2>
        <p className="mt-1 text-sm text-white/60">
          Book a quick test appointment on your own page. Takes about 30
          seconds.
        </p>
      </section>

      <PreviewActionBar compact={compact}>
        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={onBookTest}
            className="shrink-0"
          >
            Book a test appointment
          </Button>
          <button
            type="button"
            onClick={onSkip}
            className="cursor-pointer text-sm font-medium text-white/60 hover:text-white"
          >
            Skip for now
          </button>
        </div>
      </PreviewActionBar>
    </div>
  );
}
