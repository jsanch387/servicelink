'use client';

import { Switch } from '@/components/shared';
import { API_ROUTES } from '@/constants/routes';
import React, { useEffect, useState } from 'react';

export interface AcceptQuoteRequestsTogglePanelProps {
  /** Saved value from `business_profiles.accept_quote_req`. */
  initialAcceptQuoteRequests: boolean;
  /** When true (free tier), switch is read-only. */
  disabled?: boolean;
}

/**
 * Opt in/out of showing Request quote on the booking page.
 * Persists via PATCH when `disabled` is false.
 */
export const AcceptQuoteRequestsTogglePanel: React.FC<
  AcceptQuoteRequestsTogglePanelProps
> = ({ initialAcceptQuoteRequests, disabled = false }) => {
  const [acceptRequests, setAcceptRequests] = useState(
    initialAcceptQuoteRequests
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAcceptRequests(initialAcceptQuoteRequests);
  }, [initialAcceptQuoteRequests]);

  const handleChange = async (next: boolean) => {
    if (disabled || saving) return;
    const previous = acceptRequests;
    setAcceptRequests(next);
    setSaving(true);
    try {
      const res = await fetch(
        API_ROUTES.BUSINESS_PROFILE_ACCEPT_QUOTE_REQUESTS,
        {
          method: 'PATCH',

          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ acceptQuoteRequests: next }),
        }
      );
      const json = (await res.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
      } | null;
      if (!res.ok || !json?.success) {
        setAcceptRequests(previous);
      }
    } catch {
      setAcceptRequests(previous);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`mb-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-4 sm:px-5 sm:py-4 ${disabled ? 'opacity-95' : ''}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-white sm:text-lg">
            Accept Requests?
          </h2>
          <p className="mt-1 text-xs text-gray-500 sm:text-sm">
            Lets the <span className="text-gray-400">Request quote</span> button
            show on your booking page.
          </p>
        </div>
        <Switch
          checked={acceptRequests}
          onCheckedChange={handleChange}
          disabled={disabled || saving}
          size="md"
          aria-label={
            disabled
              ? 'Accept quote requests — Pro required'
              : 'Accept quote requests on your booking page'
          }
          className="shrink-0"
        />
      </div>
    </div>
  );
};
