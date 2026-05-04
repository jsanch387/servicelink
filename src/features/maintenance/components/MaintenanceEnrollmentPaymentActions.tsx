'use client';

import { Button } from '@/components/shared';
import { maintenanceEnrollmentPaidWithCard } from '@/features/maintenance/server/maintenanceEnrollmentPaymentStatus';
import { CheckIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useRef, useState } from 'react';

interface MaintenanceEnrollmentPaymentActionsProps {
  token: string;
  businessDisplayName: string;
  showPayInPerson: boolean;
  showPayWithCard: boolean;
  /** False until the customer (or owner) set a maintenance date and time. */
  firstVisitScheduled: boolean;
  initialStatus: string;
  initialPaymentStatus: string;
  checkoutReturn?: 'success' | 'cancel' | null;
}

export const MaintenanceEnrollmentPaymentActions: React.FC<
  MaintenanceEnrollmentPaymentActionsProps
> = ({
  token,
  businessDisplayName,
  showPayInPerson,
  showPayWithCard,
  firstVisitScheduled,
  initialStatus,
  initialPaymentStatus,
  checkoutReturn,
}) => {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [paymentStatus, setPaymentStatus] = useState(initialPaymentStatus);
  const [loading, setLoading] = useState<'in_person' | 'card' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const refreshAttempts = useRef(0);

  const needsPaymentChoice = showPayInPerson && showPayWithCard;
  const [paymentChoice, setPaymentChoice] = useState<
    'in_person' | 'card' | null
  >(null);

  const effectiveChoice = useMemo(() => {
    if (needsPaymentChoice) return paymentChoice;
    if (showPayWithCard && !showPayInPerson) return 'card' as const;
    if (showPayInPerson && !showPayWithCard) return 'in_person' as const;
    return null;
  }, [needsPaymentChoice, paymentChoice, showPayInPerson, showPayWithCard]);

  const isAccepted = status === 'accepted';
  const inPersonOnly = showPayInPerson && !showPayWithCard;
  const awaitingStripe =
    checkoutReturn === 'success' &&
    !isAccepted &&
    status === 'enrolled_pending_customer' &&
    paymentStatus === 'pending';

  useEffect(() => {
    if (!awaitingStripe) return;
    const id = window.setInterval(() => {
      refreshAttempts.current += 1;
      router.refresh();
      if (refreshAttempts.current >= 8) {
        window.clearInterval(id);
      }
    }, 2000);
    return () => window.clearInterval(id);
  }, [awaitingStripe, router]);

  useEffect(() => {
    setStatus(initialStatus);
    setPaymentStatus(initialPaymentStatus);
  }, [initialStatus, initialPaymentStatus]);

  const confirmInPerson = async () => {
    if (loading || isAccepted) return;
    setError(null);
    setLoading('in_person');
    try {
      const res = await fetch('/api/public/maintenance-enrollment/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        error?: string;
        alreadyAccepted?: boolean;
      };
      if (!res.ok || !json.success) {
        setError(json.error || 'Could not confirm. Please try again.');
        return;
      }
      setStatus('accepted');
      setPaymentStatus('pay_in_person');
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const startCardCheckout = async () => {
    if (loading || isAccepted) return;
    setError(null);
    setLoading('card');
    try {
      const res = await fetch('/api/public/maintenance-enrollment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        url?: string;
        error?: string;
      };
      if (!res.ok || !json.success || !json.url) {
        setError(json.error || 'Could not start card checkout.');
        return;
      }
      window.location.href = json.url;
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const handlePrimaryAction = () => {
    if (loading || isAccepted) return;
    if (effectiveChoice === 'card') {
      void startCardCheckout();
      return;
    }
    if (effectiveChoice === 'in_person') {
      void confirmInPerson();
    }
  };

  if (isAccepted) {
    const paidOnline = maintenanceEnrollmentPaidWithCard(paymentStatus);
    const inPerson = paymentStatus === 'pay_in_person';
    return (
      <p className="text-left text-sm text-gray-300">
        {paidOnline && 'Payment was completed online with card.'}
        {inPerson &&
          `Pay in person — arrange payment directly with ${businessDisplayName}.`}
        {!paidOnline && !inPerson && 'This enrollment is complete on our side.'}
      </p>
    );
  }

  if (!showPayInPerson && !showPayWithCard) {
    return (
      <p className="text-left text-sm text-gray-300">
        Card checkout isn&apos;t available on this link, and pay in person
        wasn&apos;t offered. Contact {businessDisplayName} to finish enrolling.
      </p>
    );
  }

  const primaryDisabled =
    loading !== null ||
    effectiveChoice === null ||
    (!firstVisitScheduled && !isAccepted);

  const primaryLabel =
    !firstVisitScheduled && !isAccepted
      ? 'Pick a date first'
      : effectiveChoice === 'card'
        ? 'Go to checkout'
        : effectiveChoice === 'in_person'
          ? 'Confirm'
          : 'Choose a payment option';

  const paymentOptionClasses = (selected: boolean) =>
    `flex w-full flex-1 items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors sm:min-h-0 ${
      selected
        ? 'border-white/25 bg-white/[0.08] ring-1 ring-white/10'
        : 'border-white/[0.08] bg-transparent hover:border-white/18 hover:bg-white/[0.03]'
    }`;

  const radioIndicator = (selected: boolean) => (
    <span
      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
        selected
          ? 'border-white bg-white text-neutral-900'
          : 'border-white/25 bg-transparent'
      }`}
      aria-hidden
    >
      {selected ? <CheckIcon className="h-3 w-3" /> : null}
    </span>
  );

  return (
    <div className="space-y-3">
      {inPersonOnly && firstVisitScheduled && !isAccepted ? (
        <p className="text-sm text-gray-400">
          This business isn&apos;t set up for card checkout here. Confirm below
          to confirm—you&apos;ll pay {businessDisplayName} in person.
        </p>
      ) : null}
      {!firstVisitScheduled && !isAccepted ? (
        <p className="text-sm text-amber-200/90">
          Set a date above before you can pay or confirm.
        </p>
      ) : null}
      {checkoutReturn === 'cancel' ? (
        <p className="text-sm text-gray-400">
          Card checkout was canceled. You can try again below.
        </p>
      ) : null}
      {awaitingStripe ? (
        <p className="text-sm text-gray-300">
          Processing your payment… this usually takes a few seconds. The page
          will update automatically.
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-red-300" role="alert">
          {error}
        </p>
      ) : null}

      {needsPaymentChoice ? (
        <div
          className="space-y-2"
          role="radiogroup"
          aria-label="How do you want to pay?"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <button
              type="button"
              role="radio"
              aria-checked={paymentChoice === 'card'}
              onClick={() => {
                setPaymentChoice('card');
                setError(null);
              }}
              className={paymentOptionClasses(paymentChoice === 'card')}
            >
              {radioIndicator(paymentChoice === 'card')}
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-white">
                  Pay with card
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-gray-500">
                  Pay online on this page.
                </span>
              </span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={paymentChoice === 'in_person'}
              onClick={() => {
                setPaymentChoice('in_person');
                setError(null);
              }}
              className={paymentOptionClasses(paymentChoice === 'in_person')}
            >
              {radioIndicator(paymentChoice === 'in_person')}
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-white">
                  Pay in person
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-gray-500">
                  Pay them in person.
                </span>
              </span>
            </button>
          </div>
        </div>
      ) : null}

      <Button
        type="button"
        variant="inverse"
        size="md"
        fullWidth
        loading={loading === 'card' || loading === 'in_person'}
        disabled={primaryDisabled}
        onClick={handlePrimaryAction}
      >
        {primaryLabel}
      </Button>
    </div>
  );
};
