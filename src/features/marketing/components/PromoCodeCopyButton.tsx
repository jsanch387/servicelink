'use client';

import { copyTextToClipboardSync } from '@/lib/copyTextToClipboard';
import { CheckIcon, ClipboardIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useRef, useState } from 'react';

const COPIED_RESET_MS = 2000;

interface PromoCodeCopyButtonProps {
  code: string;
  className?: string;
}

export const PromoCodeCopyButton: React.FC<PromoCodeCopyButtonProps> = ({
  code,
  className = '',
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
      className={`cursor-pointer text-gray-400 transition-colors hover:text-white ${className}`}
      title={copied ? 'Copied' : 'Copy code'}
      aria-label={copied ? 'Copied' : 'Copy code'}
    >
      {copied ? (
        <CheckIcon className="h-4 w-4 text-emerald-400" strokeWidth={2.5} />
      ) : (
        <ClipboardIcon className="h-4 w-4" />
      )}
    </button>
  );
};
