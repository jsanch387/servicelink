'use client';

import { Button } from '@/components/shared';
import { API_ROUTES } from '@/constants/routes';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';

export const InvoicePayButton: React.FC<{
  shortCode: string;
  amountLabel: string;
}> = ({ shortCode, amountLabel }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const response = await fetch(API_ROUTES.PUBLIC_INVOICE_CHECKOUT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shortCode }),
      });
      const json = (await response.json().catch(() => null)) as {
        success?: boolean;
        url?: string;
        alreadyPaid?: boolean;
        error?: string;
      } | null;

      if (json?.alreadyPaid) {
        window.location.reload();
        return;
      }

      if (!response.ok || !json?.url) {
        setError(json?.error || 'Could not start checkout.');
        setBusy(false);
        return;
      }

      window.location.assign(json.url);
    } catch {
      setError('Could not start checkout.');
      setBusy(false);
    }
  };

  return (
    <div className="mt-8">
      <Button
        type="button"
        size="lg"
        fullWidth
        loading={busy}
        disabled={busy}
        onClick={() => void pay()}
        className="!bg-[#141210] !text-[#f7f4ee] hover:!bg-black"
      >
        Pay {amountLabel}
      </Button>
      {error ? (
        <p className="mt-3 text-center text-sm text-[#8a3b32]" role="alert">
          {error}
        </p>
      ) : null}
      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-[#8d877f]">
        <LockClosedIcon className="h-3.5 w-3.5" aria-hidden />
        Secure checkout powered by Stripe
      </p>
    </div>
  );
};
