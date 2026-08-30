'use client';

import { Select } from '@/components/shared';
import { LocationAutocomplete } from '@/features/location/components/LocationAutocomplete';
import type { StructuredLocation } from '@/features/location/types/location';
import { MapPinIcon } from '@heroicons/react/24/outline';
import React from 'react';
import { SERVICE_RADIUS_OPTIONS } from '../constants/serviceRadius';

export interface DashboardProfileCoverageCardProps {
  locationQuery: string;
  onLocationQueryChange: (value: string) => void;
  selectedLocation: StructuredLocation | null;
  onSelectLocation: (location: StructuredLocation) => void;
  radiusMiles: number;
  onRadiusChange: (miles: number) => void;
  error?: string;
}

export function DashboardProfileCoverageCard({
  locationQuery,
  onLocationQueryChange,
  selectedLocation,
  onSelectLocation,
  radiusMiles,
  onRadiusChange,
  error,
}: DashboardProfileCoverageCardProps) {
  const locationError = error?.toLowerCase().includes('travel distance')
    ? undefined
    : error;
  const radiusError = error?.toLowerCase().includes('travel distance')
    ? error
    : undefined;

  return (
    <div className="space-y-5">
      <LocationAutocomplete
        id="profile-service-area-location"
        label="Base location"
        value={locationQuery}
        onChange={onLocationQueryChange}
        onSelect={onSelectLocation}
        mode="service-origin"
        placeholder="Search city, state, or ZIP"
        required
        error={locationError}
      />

      <Select
        label="Travel distance"
        value={String(radiusMiles)}
        onChange={value => onRadiusChange(Number(value))}
        options={SERVICE_RADIUS_OPTIONS}
        placeholder="Select radius"
        name="profile-service-area-radius"
        required
        error={radiusError}
      />

      {selectedLocation ? (
        <p className="flex items-center gap-1.5 text-xs leading-5 text-zinc-400">
          <MapPinIcon
            className="h-3.5 w-3.5 shrink-0 text-zinc-500"
            aria-hidden
          />
          <span>
            {selectedLocation.city}, {selectedLocation.state} · {radiusMiles} mi
          </span>
        </p>
      ) : (
        <p className="text-xs leading-5 text-zinc-500">
          City and state are enough. Nearby customers will see this on your
          booking link.
        </p>
      )}
    </div>
  );
}
