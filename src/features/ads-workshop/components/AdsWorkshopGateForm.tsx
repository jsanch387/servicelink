'use client';

import { Button, GlassCard, Input } from '@/components/shared';
import { PlayIcon } from '@heroicons/react/24/solid';
import { useCallback, useState } from 'react';

import { WORKSHOP_GATE } from '../data/workshopSeoContent';
import { getAdsWorkshopEmailError } from '../utils/validateWorkshopEmail';

export type AdsWorkshopGateFormProps = {
  onAccessGranted: (email: string) => void;
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
      // Mimic network latency; emails are not stored yet.
      await new Promise(resolve => setTimeout(resolve, 400));
      onAccessGranted(email.trim());
      setLoading(false);
    },
    [email, loading, onAccessGranted]
  );

  return (
    <GlassCard padding="lg" rounded="rounded-2xl" className="w-full">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-white/10 border border-white/20">
        <PlayIcon className="h-7 w-7 text-white" aria-hidden />
      </div>
      <h2 className="text-xl sm:text-2xl font-semibold text-white text-center mb-2">
        {WORKSHOP_GATE.title}
      </h2>
      <p className="text-sm text-gray-400 text-center leading-relaxed mb-6 max-w-md mx-auto">
        {WORKSHOP_GATE.description}
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 max-w-md mx-auto w-full"
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

      <p className="mt-5 text-xs text-gray-500 text-center leading-relaxed">
        {WORKSHOP_GATE.consent}
      </p>
    </GlassCard>
  );
}
