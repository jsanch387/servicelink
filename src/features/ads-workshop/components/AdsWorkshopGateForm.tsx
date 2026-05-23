'use client';

import { Button, GlassCard, Input } from '@/components/shared';
import { API_ROUTES } from '@/constants/routes';
import { PlayIcon } from '@heroicons/react/24/solid';
import { useCallback, useState } from 'react';

import { WORKSHOP_GATE } from '../data/workshopSeoContent';
import { getAdsWorkshopEmailError } from '../utils/validateWorkshopEmail';
import {
  trackWorkshopEvent,
  WORKSHOP_ANALYTICS_EVENTS,
} from '../utils/workshopAnalytics';
import { markWorkshopAttribution } from '../utils/workshopAttribution';
import { persistWorkshopLeadId } from '../utils/workshopLeadSession';
import { buildWorkshopRegisterPayload } from '../utils/workshopLeadTracking';

export type AdsWorkshopGateFormProps = {
  onAccessGranted: () => void;
};

export function AdsWorkshopGateForm({
  onAccessGranted,
}: AdsWorkshopGateFormProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (loading) return;

      const validationError = getAdsWorkshopEmailError(email);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      setLoading(true);

      try {
        const res = await fetch(API_ROUTES.WORKSHOP_REGISTER, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildWorkshopRegisterPayload(email)),
        });

        const data = (await res.json()) as {
          success?: boolean;
          error?: string;
          leadId?: string;
        };

        if (!res.ok || !data.success) {
          setError(data.error ?? 'Something went wrong. Please try again.');
          return;
        }

        if (data.leadId) {
          persistWorkshopLeadId(data.leadId);
        }

        markWorkshopAttribution();
        trackWorkshopEvent(WORKSHOP_ANALYTICS_EVENTS.EMAIL_SUBMIT);
        onAccessGranted();
      } catch {
        setError('Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [email, loading, onAccessGranted]
  );

  return (
    <GlassCard
      padding="none"
      rounded="rounded-2xl"
      className="w-full p-4 sm:p-6 md:p-7"
    >
      <div className="mx-auto mb-4 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-white/10 border border-white/20">
        <PlayIcon className="h-6 w-6 sm:h-7 sm:w-7 text-white" aria-hidden />
      </div>
      <h2 className="text-lg sm:text-xl font-semibold text-white text-center mb-2">
        {WORKSHOP_GATE.title}
      </h2>
      <p className="text-sm sm:text-[0.9375rem] text-gray-400 text-center leading-relaxed mb-5 sm:mb-6">
        {WORKSHOP_GATE.description}
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-3.5 sm:space-y-4 w-full touch-manipulation"
        aria-label="Unlock workshop video"
      >
        <Input
          label="Email address"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={email}
          onChange={value => {
            setEmail(value);
            if (error) setError(null);
          }}
          error={error ?? undefined}
          required
        />
        <Button
          type="submit"
          variant="inverse"
          size="lg"
          fullWidth
          loading={loading}
        >
          {WORKSHOP_GATE.submitLabel}
        </Button>
      </form>

      <p className="mt-4 sm:mt-5 text-xs text-gray-500 text-center leading-relaxed px-0.5">
        {WORKSHOP_GATE.consent}
      </p>
    </GlassCard>
  );
}
