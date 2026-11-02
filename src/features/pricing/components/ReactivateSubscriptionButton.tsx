'use client';

import { Button } from '@/components/shared';
import { API_ROUTES } from '@/constants/routes';
import React, { useState } from 'react';

/**
 * Charges the card already on file for the open bill. Reloads when Pro is back.
 */
export const ReactivateSubscriptionButton: React.FC<{
  className?: string;
}> = ({ className = 'w-full' }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReactivate = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(API_ROUTES.STRIPE_REACTIVATE_SUBSCRIPTION, {
        method: 'POST',
      });
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        url?: string;
      };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      if (!res.ok || !data.success) {
        setError(data.error ?? 'Something went wrong');
        setLoading(false);
        return;
      }
      window.location.reload();
    } catch {
      setError('Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-2">
      <Button
        type="button"
        variant="inverse"
        className={className}
        onClick={handleReactivate}
        disabled={loading}
        loading={loading}
      >
        Reactivate
      </Button>
      {error ? (
        <p className="text-sm text-rose-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
};
