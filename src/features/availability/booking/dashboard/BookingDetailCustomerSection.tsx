'use client';

import { copyTextToClipboardSync } from '@/lib/copyTextToClipboard';
import { formatUsPhoneWithCountry, usPhoneTelHref } from '@/lib/formatUsPhone';
import {
  ArrowPathRoundedSquareIcon,
  ClipboardDocumentIcon,
  EnvelopeIcon,
  PhoneIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import { useEffect, useRef, useState } from 'react';

const COPIED_RESET_MS = 1600;

const iconBtnClass =
  'inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed';

function CopyIconButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = () => {
    if (!copyTextToClipboardSync(value)) return;
    setCopied(true);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setCopied(false);
      timerRef.current = null;
    }, COPIED_RESET_MS);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={iconBtnClass}
      aria-label={copied ? `${label} copied` : `Copy ${label}`}
      title={copied ? 'Copied' : `Copy ${label}`}
    >
      {copied ? (
        <CheckIcon className="h-4 w-4 text-emerald-400" aria-hidden />
      ) : (
        <ClipboardDocumentIcon className="h-4 w-4" aria-hidden />
      )}
    </button>
  );
}

export function BookingDetailCustomerSection({
  customerName,
  customerPhone,
  customerEmail,
  isMembershipVisit,
}: {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  isMembershipVisit: boolean;
}) {
  const phoneFormatted = customerPhone.trim()
    ? formatUsPhoneWithCountry(customerPhone)
    : '';
  const telHref = usPhoneTelHref(customerPhone);
  const hasPhone = Boolean(telHref);
  const emailTrimmed = customerEmail.trim();
  const hasEmail = emailTrimmed.length > 0;

  return (
    <section>
      <h3 className="mb-3 text-xs font-semibold tracking-wider text-gray-500">
        Customer
      </h3>
      <div className="space-y-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
        <div className="flex items-start gap-2">
          <UserCircleIcon
            className="mt-0.5 h-5 w-5 shrink-0 text-gray-400"
            aria-hidden
          />
          <p className="min-w-0 flex-1 font-semibold text-white [overflow-wrap:anywhere]">
            {customerName}
          </p>
          {isMembershipVisit ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/12 bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-gray-200">
              <ArrowPathRoundedSquareIcon className="h-3.5 w-3.5" aria-hidden />
              Membership
            </span>
          ) : null}
        </div>

        {hasPhone || hasEmail ? (
          <div className="space-y-1.5 border-t border-white/[0.06] pt-3">
            {hasPhone && telHref ? (
              <div className="flex items-center gap-1.5">
                <PhoneIcon
                  className="h-4 w-4 shrink-0 text-gray-500"
                  aria-hidden
                />
                <span className="min-w-0 flex-1 text-sm tabular-nums text-gray-200">
                  {phoneFormatted}
                </span>
                <CopyIconButton value={phoneFormatted} label="phone number" />
                <a
                  href={telHref}
                  aria-label="Call customer"
                  title="Call"
                  className={iconBtnClass}
                >
                  <PhoneIcon className="h-4 w-4" aria-hidden />
                </a>
              </div>
            ) : null}
            {hasEmail ? (
              <div className="flex items-center gap-1.5">
                <EnvelopeIcon
                  className="h-4 w-4 shrink-0 text-gray-500"
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate text-sm text-gray-200">
                  {emailTrimmed}
                </span>
                <CopyIconButton value={emailTrimmed} label="email" />
                <a
                  href={`mailto:${emailTrimmed}`}
                  aria-label="Email customer"
                  title="Email"
                  className={iconBtnClass}
                >
                  <EnvelopeIcon className="h-4 w-4" aria-hidden />
                </a>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
