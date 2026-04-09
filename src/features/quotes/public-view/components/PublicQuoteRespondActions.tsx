'use client';

import { Button, Input } from '@/components/shared';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

interface PublicQuoteRespondActionsProps {
  token: string;
  initialStatus: string;
}

export const PublicQuoteRespondActions: React.FC<
  PublicQuoteRespondActionsProps
> = ({ token, initialStatus }) => {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState<'approve' | 'decline' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [street, setStreet] = useState('');
  const [unit, setUnit] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [addressErrors, setAddressErrors] = useState<{
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  }>({});

  const canRespond = status === 'sent' || status === 'viewed';

  useEffect(() => {
    if (!finalizeOpen) return;
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, [finalizeOpen]);

  const closeFinalize = () => {
    setFinalizeOpen(false);
    setError(null);
  };

  const submit = async (decision: 'approve' | 'decline', address?: string) => {
    if (!canRespond || loading) return;
    setError(null);
    setLoading(decision);
    try {
      const res = await fetch('/api/quotes/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          decision,
          serviceAddress: address?.trim() || undefined,
        }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        status?: string;
        error?: string;
        alreadyResponded?: boolean;
      };
      if (!res.ok || !json.success) {
        setError(json.error || 'Something went wrong. Please try again.');
        return;
      }
      if (json.status === 'approved' || json.status === 'declined') {
        setFinalizeOpen(false);
        setStatus(json.status);
        router.refresh();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const handleFinalize = async () => {
    const nextErrors: {
      street?: string;
      city?: string;
      state?: string;
      zip?: string;
    } = {};
    const streetVal = street.trim();
    const cityVal = city.trim();
    const stateVal = state.trim().toUpperCase();
    const zipVal = zip.trim();

    if (streetVal.length < 5) {
      nextErrors.street = 'Enter a valid street address';
    }
    if (cityVal.length < 2) {
      nextErrors.city = 'Enter a valid city';
    }
    if (!/^[A-Z]{2}$/.test(stateVal)) {
      nextErrors.state = 'Use 2-letter state code';
    }
    if (!/^\d{5}(-\d{4})?$/.test(zipVal)) {
      nextErrors.zip = 'Enter a valid ZIP code';
    }

    if (Object.keys(nextErrors).length > 0) {
      setAddressErrors(nextErrors);
      return;
    }

    setAddressErrors({});
    const parts = [
      streetVal,
      unit.trim() ? `Unit ${unit.trim()}` : '',
      `${cityVal}, ${stateVal} ${zipVal}`,
    ].filter(Boolean);
    await submit('approve', parts.join(', '));
  };

  if (status === 'approved' || status === 'declined') {
    return null;
  }

  if (!canRespond) {
    return (
      <p className="mt-6 text-center text-sm text-gray-500">
        This quote is no longer open for a response.
      </p>
    );
  }

  return (
    <>
      <div className="mt-6 space-y-3">
        {error && !finalizeOpen ? (
          <p className="text-center text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            type="button"
            variant="success"
            size="md"
            fullWidth
            className="sm:max-w-xs"
            disabled={loading !== null}
            onClick={() => {
              setAddressErrors({});
              setError(null);
              setFinalizeOpen(true);
            }}
          >
            Accept quote
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="md"
            fullWidth
            className="sm:max-w-xs"
            loading={loading === 'decline'}
            disabled={loading !== null}
            onClick={() => submit('decline')}
          >
            Decline
          </Button>
        </div>
      </div>

      {finalizeOpen ? (
        <div
          className="fixed inset-0 z-[60] flex flex-col bg-[var(--dashboard-bg)]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="finalize-address-intro"
        >
          <header
            className="flex-shrink-0 border-b border-white/10 px-4 py-3"
            style={{
              paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
            }}
          >
            <div className="mx-auto flex w-full max-w-xl items-center gap-3">
              <button
                type="button"
                onClick={closeFinalize}
                disabled={loading !== null}
                className="inline-flex items-center gap-2 rounded-lg px-1 py-1.5 text-sm font-medium text-gray-300 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-50"
              >
                <ArrowLeftIcon className="h-5 w-5 shrink-0" aria-hidden />
                <span>Back to quote</span>
              </button>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-32 pt-6 sm:pt-8">
            <div className="mx-auto w-full max-w-xl space-y-6">
              <p
                id="finalize-address-intro"
                className="text-sm text-gray-400 sm:text-[15px]"
              >
                Provide your address for this service.
              </p>

              <section className="space-y-4">
                <Input
                  label="Street"
                  placeholder="123 Main St"
                  value={street}
                  onChange={setStreet}
                  autoComplete="street-address"
                  required
                  error={addressErrors.street}
                />
                <Input
                  label="Unit (optional)"
                  placeholder="Apt 4B"
                  value={unit}
                  onChange={setUnit}
                  autoComplete="address-line2"
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Input
                    label="City"
                    placeholder="Miami"
                    value={city}
                    onChange={setCity}
                    autoComplete="address-level2"
                    required
                    error={addressErrors.city}
                  />
                  <Input
                    label="State"
                    placeholder="FL"
                    value={state}
                    onChange={value => setState(value.toUpperCase())}
                    autoComplete="address-level1"
                    required
                    maxLength={2}
                    error={addressErrors.state}
                  />
                  <Input
                    label="ZIP"
                    placeholder="33101"
                    value={zip}
                    onChange={setZip}
                    inputMode="numeric"
                    autoComplete="postal-code"
                    required
                    maxLength={10}
                    error={addressErrors.zip}
                  />
                </div>
              </section>

              {error ? (
                <p className="text-sm text-red-400" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
          </div>

          <div
            className="safe-area-pb fixed bottom-0 left-0 right-0 z-[61] border-t border-white/10 bg-[var(--dashboard-bg)]/95 p-4 backdrop-blur-sm"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            <div className="mx-auto w-full max-w-xl">
              <Button
                type="button"
                variant="success"
                size="md"
                fullWidth
                loading={loading === 'approve'}
                disabled={loading !== null}
                onClick={handleFinalize}
              >
                Finalize booking
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};
