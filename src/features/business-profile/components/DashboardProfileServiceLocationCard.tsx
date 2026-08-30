'use client';

import { GlassCard, Input } from '@/components/shared';
import { LocationAutocomplete } from '@/features/location/components/LocationAutocomplete';
import type { StructuredLocation } from '@/features/location/types/location';
import { DashboardProfileCoverageCard } from './DashboardProfileCoverageCard';
import React, { useEffect, useState } from 'react';
import type {
  ServiceLocationMode,
  ServiceLocationUiState,
  ShopAddressUiState,
} from '../utils/serviceLocationMode';
import { SHOP_ADDRESS_FIELD_ID } from '../constants/shopAddressPrompt';
import { coverageErrorFromMessages } from '../utils/primaryServiceArea';
import {
  formatShopPickerQuery,
  mobileServiceIsOffered,
  serviceLocationModeHint,
  shopAddressFromStructuredLocation,
  shopAddressIsOffered,
} from '../utils/serviceLocationMode';

export interface DashboardProfileServiceLocationCardProps {
  value: ServiceLocationUiState;
  onChange: (next: ServiceLocationUiState) => void;
  /** e.g. "Austin, TX · 25 mi" from Details. Used on Both. */
  coverageLabel?: string | null;
  onEditDetails?: () => void;
  locationQuery: string;
  onLocationQueryChange: (value: string) => void;
  selectedLocation: StructuredLocation | null;
  onSelectLocation: (location: StructuredLocation) => void;
  radiusMiles: number;
  onRadiusChange: (miles: number) => void;
  errors?: string[];
}

const MODE_OPTIONS: { value: ServiceLocationMode; label: string }[] = [
  { value: 'mobile_only', label: 'Mobile' },
  { value: 'shop_only', label: 'Shop' },
  { value: 'both', label: 'Both' },
];

function updateShopAddress(
  value: ServiceLocationUiState,
  onChange: (next: ServiceLocationUiState) => void,
  patch: Partial<ShopAddressUiState>
) {
  onChange({
    ...value,
    shopAddress: { ...value.shopAddress, ...patch },
  });
}

export function DashboardProfileServiceLocationCard({
  value,
  onChange,
  coverageLabel,
  onEditDetails,
  locationQuery,
  onLocationQueryChange,
  selectedLocation,
  onSelectLocation,
  radiusMiles,
  onRadiusChange,
  errors = [],
}: DashboardProfileServiceLocationCardProps) {
  const showShopFields = shopAddressIsOffered(value.mode);
  const showMobileCoverageEditor = value.mode === 'mobile_only';
  const showMobileHint =
    mobileServiceIsOffered(value.mode) && !showMobileCoverageEditor;
  const coverageError = coverageErrorFromMessages(errors);
  const modeHint = serviceLocationModeHint(value.mode);
  const trimmedCoverage = coverageLabel?.trim() || null;
  const confirmedQuery = formatShopPickerQuery(value.shopAddress);
  const [shopQuery, setShopQuery] = useState(confirmedQuery);
  const shopAddressError = errors.find(e =>
    e.toLowerCase().includes('shop address')
  );
  const shopZipError = errors.find(e => e.toLowerCase().includes('shop zip'));
  const hasConfirmedShop = Boolean(
    value.shopAddress.streetAddress.trim() &&
      value.shopAddress.city.trim() &&
      value.shopAddress.state.trim()
  );

  useEffect(() => {
    if (hasConfirmedShop) {
      setShopQuery(confirmedQuery);
    }
  }, [confirmedQuery, hasConfirmedShop]);

  const handleShopQueryChange = (next: string) => {
    setShopQuery(next);
    if (hasConfirmedShop && next.trim() !== confirmedQuery) {
      updateShopAddress(value, onChange, {
        streetAddress: '',
        city: '',
        state: '',
        zip: '',
      });
    }
  };

  const handleShopSelect = (location: StructuredLocation) => {
    onChange({
      ...value,
      shopAddress: shopAddressFromStructuredLocation(
        location,
        value.shopAddress.unitApt
      ),
    });
    setShopQuery(location.label);
  };

  return (
    <div className="w-full max-w-full text-left">
      <p className="text-sm font-medium text-gray-200">Where you work</p>
      <p className="mt-1 text-xs text-zinc-500">
        How customers get service on your booking link.
      </p>

      <GlassCard
        padding="sm"
        rounded="rounded-xl"
        className="mt-2 w-full max-w-full"
      >
        <p className="mb-2 text-xs font-medium text-zinc-400">Service type</p>
        <div
          className="flex w-full rounded-lg border border-white/10 bg-black/25 p-1"
          role="radiogroup"
          aria-label="Service type"
          aria-describedby={modeHint ? 'service-location-mode-hint' : undefined}
        >
          {MODE_OPTIONS.map(option => {
            const selected = value.mode === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChange({ ...value, mode: option.value })}
                className={`min-h-[40px] flex-1 cursor-pointer touch-manipulation rounded-md px-2 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25 ${
                  selected
                    ? 'bg-white/[0.12] text-white'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {modeHint ? (
          <p
            id="service-location-mode-hint"
            className="mt-2 text-xs leading-relaxed text-zinc-500"
          >
            {modeHint}
          </p>
        ) : null}

        {showShopFields ? (
          <div className="mt-4 space-y-4 border-t border-white/[0.06] pt-4">
            <LocationAutocomplete
              id={SHOP_ADDRESS_FIELD_ID}
              label="Shop address"
              description="Where customers should visit."
              value={shopQuery}
              onChange={handleShopQueryChange}
              onSelect={handleShopSelect}
              mode="street-address"
              placeholder="Search street address"
              required
              error={
                shopAddressError
                  ? 'Choose a suggested address'
                  : shopZipError
                    ? 'ZIP must be 5 digits'
                    : undefined
              }
            />

            <Input
              label="Unit"
              placeholder="Suite 4B (optional)"
              value={value.shopAddress.unitApt}
              onChange={unitApt =>
                updateShopAddress(value, onChange, { unitApt })
              }
            />
          </div>
        ) : null}

        {showMobileCoverageEditor ? (
          <div className="mt-4 border-t border-white/[0.06] pt-4">
            <DashboardProfileCoverageCard
              locationQuery={locationQuery}
              onLocationQueryChange={onLocationQueryChange}
              selectedLocation={selectedLocation}
              onSelectLocation={onSelectLocation}
              radiusMiles={radiusMiles}
              onRadiusChange={onRadiusChange}
              error={coverageError}
            />
          </div>
        ) : null}

        {showMobileHint ? (
          <div className="mt-4 flex items-start justify-between gap-3 border-t border-white/[0.06] pt-4">
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-400">
                {showShopFields ? 'Mobile area' : 'Your service area'}
              </p>
              {trimmedCoverage ? (
                <p className="mt-1 text-sm text-zinc-300">{trimmedCoverage}</p>
              ) : (
                <p className="mt-1 text-xs text-zinc-500">
                  Set city, state, and travel distance in Details.
                </p>
              )}
            </div>
            {onEditDetails ? (
              <button
                type="button"
                onClick={onEditDetails}
                className="shrink-0 cursor-pointer text-xs font-medium text-zinc-400 transition-colors hover:text-white"
              >
                Edit
              </button>
            ) : null}
          </div>
        ) : null}
      </GlassCard>
    </div>
  );
}
