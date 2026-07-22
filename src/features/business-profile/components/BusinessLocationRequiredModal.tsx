'use client';

import { Button, Modal, Select } from '@/components/shared';
import {
  buildServiceAreaPayload,
  savePrimaryServiceArea,
} from '@/features/business-profile/api/savePrimaryServiceArea';
import {
  SERVICE_AREA_PROMPT_DISMISSIBLE,
  serviceAreaSessionSkipKey,
} from '@/features/business-profile/constants/serviceAreaPrompt';
import { LocationAutocomplete } from '@/features/location/components/LocationAutocomplete';
import type { StructuredLocation } from '@/features/location/types/location';
import React, { useEffect, useState } from 'react';
import { FiNavigation } from 'react-icons/fi';

const SERVICE_RADIUS_OPTIONS = [
  { value: '5', label: '5 miles' },
  { value: '10', label: '10 miles' },
  { value: '15', label: '15 miles' },
  { value: '20', label: '20 miles' },
  { value: '25', label: '25 miles' },
  { value: '30', label: '30 miles' },
  { value: '40', label: '40 miles' },
  { value: '50', label: '50 miles' },
  { value: '75', label: '75 miles' },
  { value: '100', label: '100 miles' },
] as const;

interface BusinessLocationRequiredModalProps {
  businessProfileId: string;
  /** When true, owner already confirmed a primary service area in the DB. */
  hasConfirmedServiceArea: boolean;
}

export function BusinessLocationRequiredModal({
  businessProfileId,
  hasConfirmedServiceArea,
}: BusinessLocationRequiredModalProps) {
  const skipKey = serviceAreaSessionSkipKey(businessProfileId);

  const [isOpen, setIsOpen] = useState(false);
  // Always start blank — do not prefill legacy service_area / business_zip.
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedLocation, setSelectedLocation] =
    useState<StructuredLocation | null>(null);
  const [radius, setRadius] = useState('25');
  const [locationError, setLocationError] = useState<string>();
  const [radiusError, setRadiusError] = useState<string>();
  const [submitError, setSubmitError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (hasConfirmedServiceArea) {
      setIsOpen(false);
      return;
    }

    if (SERVICE_AREA_PROMPT_DISMISSIBLE) {
      const skippedThisSession = window.sessionStorage.getItem(skipKey) === '1';
      setIsOpen(!skippedThisSession);
      return;
    }

    setIsOpen(true);
  }, [hasConfirmedServiceArea, skipKey]);

  const handleSkip = () => {
    if (!SERVICE_AREA_PROMPT_DISMISSIBLE) return;
    window.sessionStorage.setItem(skipKey, '1');
    setIsOpen(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextLocationError = selectedLocation
      ? undefined
      : 'Choose a suggested location to confirm it';
    const nextRadiusError = radius ? undefined : 'Service radius is required';

    setLocationError(nextLocationError);
    setRadiusError(nextRadiusError);
    setSubmitError(undefined);
    if (!selectedLocation || nextLocationError || nextRadiusError) return;

    setIsSubmitting(true);
    try {
      const result = await savePrimaryServiceArea(
        buildServiceAreaPayload(selectedLocation, Number(radius))
      );
      if (!result.success) {
        setSubmitError(result.error || 'Unable to save service area.');
        return;
      }

      window.sessionStorage.removeItem(skipKey);
      setIsOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => undefined}
      title=""
      maxWidth="lg"
      preventClose
      uniformHorizontalPadding16
      panelClassName="h-[92dvh] sm:h-[min(720px,88dvh)]"
      contentClassName="!pt-5 !pb-5 sm:!pt-6 sm:!pb-6"
    >
      <form onSubmit={handleSubmit} className="flex min-h-full flex-col">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.07]">
            <FiNavigation
              className="h-[1.1rem] w-[1.1rem] text-white"
              aria-hidden
            />
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-black leading-none tracking-tight text-white">
              Where do you serve?
            </h2>
            <p className="mt-1 text-sm leading-4 text-zinc-400">
              Set your base and travel distance.
            </p>
          </div>
        </div>

        <div className="mt-7 space-y-5">
          <LocationAutocomplete
            id="required-business-location"
            label="Base location"
            value={locationQuery}
            onChange={value => {
              setLocationQuery(value);
              setSelectedLocation(null);
              setLocationError(undefined);
            }}
            onSelect={location => {
              setSelectedLocation(location);
              setLocationQuery(location.label);
              setLocationError(undefined);
            }}
            mode="service-origin"
            placeholder="Search city, state, or ZIP"
            required
            error={locationError}
          />

          <Select
            label="Travel distance"
            value={radius}
            onChange={value => {
              setRadius(value);
              setRadiusError(undefined);
            }}
            options={[...SERVICE_RADIUS_OPTIONS]}
            placeholder="Select radius"
            name="required-business-radius"
            required
            error={radiusError}
          />

          <p className="text-xs leading-5 text-zinc-500">
            City and state are enough for your service area. Add a ZIP if you
            want a more specific center. We&apos;ll use this to help nearby
            customers find you in search.
          </p>
        </div>

        {selectedLocation && (
          <div className="mt-6 rounded-2xl bg-[#f2efe8] px-4 py-4 text-zinc-950">
            <p className="text-xs font-semibold text-zinc-500">
              Your customer reach
            </p>
            <p className="mt-1 text-sm font-semibold leading-5">
              Customers within {radius} miles of {selectedLocation.city},{' '}
              {selectedLocation.state} can find your business.
            </p>
          </div>
        )}

        <div className="mt-auto space-y-3 pt-6">
          {submitError ? (
            <p className="text-sm text-red-400" role="alert">
              {submitError}
            </p>
          ) : null}
          <Button
            type="submit"
            variant="inverse"
            size="md"
            fullWidth
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Confirm service area
          </Button>
          {SERVICE_AREA_PROMPT_DISMISSIBLE ? (
            <Button
              type="button"
              variant="ghost"
              size="md"
              fullWidth
              onClick={handleSkip}
              disabled={isSubmitting}
            >
              I&apos;ll add it later
            </Button>
          ) : null}
        </div>
      </form>
    </Modal>
  );
}
