'use client';

import { copyTextToClipboardSync } from '@/lib/copyTextToClipboard';
import { CheckIcon, ClipboardIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useRef, useState } from 'react';

const COPIED_RESET_MS = 2000;

interface PromoCodeCopyButtonProps {
  code: string;
  className?: string;
  variant?: 'dashboard' | 'ticket';
  copyLabel?: string;
  copiedLabel?: string;
}

export const PromoCodeCopyButton: React.FC<PromoCodeCopyButtonProps> = ({
  code,
  className = '',
  variant = 'dashboard',
  copyLabel = 'Copy code',
  copiedLabel = 'Copied',
}) => {
  const [copied, setCopied] = useState(false);
  const resetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const handleCopy = () => {
    const ok = copyTextToClipboardSync(code);
    if (!ok) return;

    setCopied(true);
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = window.setTimeout(() => {
      setCopied(false);
      resetTimerRef.current = null;
    }, COPIED_RESET_MS);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={
        variant === 'ticket'
          ? `inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-200/50 hover:text-zinc-800 ${className}`
          : `cursor-pointer text-gray-400 transition-colors hover:text-white ${className}`
      }
      title={copied ? copiedLabel : copyLabel}
      aria-label={copied ? copiedLabel : copyLabel}
    >
      {copied ? (
        <CheckIcon
          className={`${variant === 'ticket' ? 'h-4 w-4 text-emerald-600' : 'h-4 w-4 text-emerald-400'}`}
          strokeWidth={2.5}
        />
      ) : (
        <ClipboardIcon className="h-4 w-4" />
      )}
    </button>
  );
};
