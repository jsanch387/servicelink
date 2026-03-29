'use client';

import { Button, Input, PriceInput, TextArea } from '@/components/shared';
import { TimeSelect } from '@/features/availability/components/TimeSelect';
import {
  isValidServiceDurationHHmm,
  serviceDurationHHmmToMinutes,
} from '@/features/availability/utils/timeOptions';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';
import type { OnboardingV2Service } from '../types/flowState';
import { formatDurationMinutes } from '../utils/formatDuration';

/** Short description for service cards; keeps cards from getting bloated. */
const DESCRIPTION_MAX_LENGTH = 250;

interface Step2AddServiceProps {
  businessProfileId?: string;
  services: OnboardingV2Service[];

  onUpdate: (services: OnboardingV2Service[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step2AddService: React.FC<Step2AddServiceProps> = ({
  businessProfileId,
  services,
  onUpdate,
  onNext,
  onBack,
}) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [durationHHmm, setDurationHHmm] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const addService = () => {
    const descTrim = description.trim();
    if (!name.trim() || !price.trim() || !durationHHmm || !descTrim) return;
    if (!isValidServiceDurationHHmm(durationHHmm)) return;
    const minutes = serviceDurationHHmmToMinutes(durationHHmm);
    const next: OnboardingV2Service = {
      id: `temp-${Date.now()}`,
      name: name.trim(),
      price: price.trim(),
      durationMinutes: minutes,
      description: descTrim,
    };
    onUpdate([...services, next]);
    setName('');
    setPrice('');
    setDurationHHmm('');
    setDescription('');
  };

  const removeService = (index: number) => {
    onUpdate(services.filter((_, i) => i !== index));
  };

  const canAdd =
    name.trim().length > 0 &&
    price.trim().length > 0 &&
    durationHHmm.trim().length > 0 &&
    isValidServiceDurationHHmm(durationHHmm) &&
    description.trim().length > 0;
  const canContinue = services.length > 0;

  const handleNext = async () => {
    if (!canContinue || isLoading || !businessProfileId) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/onboarding-v2/step2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessProfileId,
          services: services.map(s => ({
            name: s.name,
            price: s.price,
            durationMinutes: s.durationMinutes,
            description: s.description ?? null,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }
      onNext();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">
          Add at least one service
        </h1>
        <p className="text-gray-400 text-sm sm:text-base mt-1">
          Add one service to continue — you can add the rest after onboarding.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden p-4">
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}
          <h2 className="text-base font-semibold text-white mb-4">
            Add a service
          </h2>
          <div className="space-y-4">
            <Input
              label="Service name"
              placeholder="e.g. Full detail, Lawn mowing"
              value={name}
              onChange={setName}
              required
            />
            <PriceInput
              label="Price"
              placeholder="0"
              value={price}
              onChange={setPrice}
              required
            />
            <div className="min-w-0">
              <span className="block text-sm font-medium text-gray-300 mb-2">
                Duration
              </span>
              <TimeSelect
                variant="duration"
                value={durationHHmm}
                onChange={setDurationHHmm}
                durationPlaceholder="How long does it take?"
              />
            </div>
            <TextArea
              label="What's included? (required)"
              placeholder="e.g. Exterior wash, interior vacuum, window clean"
              value={description}
              onChange={setDescription}
              rows={3}
              maxLength={DESCRIPTION_MAX_LENGTH}
              required
            />
            <Button
              type="button"
              onClick={addService}
              variant="inverse"
              className="w-full"
              disabled={!canAdd}
              icon={<PlusIcon className="h-5 w-5" />}
              iconPosition="left"
            >
              Add this service
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden p-4">
          <h2 className="text-base font-semibold text-white mb-4">
            Your services ({services.length})
          </h2>
          {services.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-4 text-center">
              <PlusIcon className="h-10 w-10 text-gray-500 mx-auto mb-3 opacity-60" />
              <p className="text-gray-400 text-sm">
                No services yet. Add one using the form on the left.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {services.map((svc, index) => (
                <div
                  key={svc.id}
                  className="flex items-start gap-3 p-3 rounded-xl border border-white/10 bg-white/[0.04]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-medium text-sm sm:text-base">
                      {svc.name}
                    </p>
                    <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
                      ${svc.price} ·{' '}
                      {formatDurationMinutes(svc.durationMinutes)}
                    </p>
                    {svc.description && (
                      <p className="text-gray-500 text-xs mt-1 line-clamp-2">
                        {svc.description}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeService(index)}
                    className="text-gray-500 hover:text-red-400 p-1 rounded-lg hover:bg-red-500/10 flex-shrink-0"
                    title="Remove"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        <Button
          type="button"
          onClick={onBack}
          variant="secondary"
          disabled={isLoading}
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={handleNext}
          variant="inverse"
          disabled={!canContinue || isLoading || !businessProfileId}
          loading={isLoading}
          className="sm:ml-auto"
        >
          Next
        </Button>
      </div>
    </div>
  );
};
