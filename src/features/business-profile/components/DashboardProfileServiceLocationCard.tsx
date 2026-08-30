'use client';

import { GlassCard, Input } from '@/components/shared';
import React from 'react';
import type {
  ServiceLocationMode,
  ServiceLocationUiState,
  ShopAddressUiState,
} from '../utils/serviceLocationMode';
import {
  mobileServiceIsOffered,
  serviceLocationModeHint,
  shopAddressIsOffered,
} from '../utils/serviceLocationMode';
import { sanitizeZipInput } from '../utils/businessLocation';

export interface DashboardProfileServiceLocationCardProps {
  value: ServiceLocationUiState;
  onChange: (next: ServiceLocationUiState) => void;
  /** City, state, ZIP — shared with Details coverage. */
  profileLocation: {
    city: string;
    state: string;
    zip: string;
  };
  onZipChange: (zip: string) => void;
  /** e.g. "Austin, TX · 25 mi" from Details. */
  coverageLabel?: string | null;
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
  profileLocation,
  onZipChange,
  coverageLabel,
  errors = [],
}: DashboardProfileServiceLocationCardProps) {
  const showShopFields = shopAddressIsOffered(value.mode);
  const showMobileHint = mobileServiceIsOffered(value.mode);
  const trimmedCoverage = coverageLabel?.trim() || null;
  const shopStreetError = errors.find(e =>
    e.toLowerCase().includes('shop street')
  );
  const shopZipError = errors.some(e =>
    e.toLowerCase().includes('shop address requires')
  );

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
          aria-describedby="service-location-mode-hint"
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

        <p
          id="service-location-mode-hint"
          className="mt-2 text-xs leading-relaxed text-zinc-500"
        >
          {serviceLocationModeHint(value.mode)}
        </p>

        {showShopFields ? (
          <div className="mt-4 space-y-4 border-t border-white/[0.06] pt-4">
            <div>
              <p className="text-xs font-medium text-zinc-400">Shop address</p>
              <p className="mt-1 text-xs text-zinc-500">
                Full address where customers visit you.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-6">
              <div className="sm:col-span-4">
                <Input
                  label="Street"
                  placeholder="123 Main St"
                  value={value.shopAddress.streetAddress}
                  onChange={streetAddress =>
                    updateShopAddress(value, onChange, { streetAddress })
                  }
                  required
                  error={shopStreetError ? 'Required' : undefined}
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Unit"
                  placeholder="Suite 4B (optional)"
                  value={value.shopAddress.unitApt}
                  onChange={unitApt =>
                    updateShopAddress(value, onChange, { unitApt })
                  }
                />
              </div>
              <div className="sm:col-span-4">
                <p className="text-xs font-medium text-zinc-400">City, state</p>
                <p className="mt-2 text-sm text-zinc-300">
                  {profileLocation.city && profileLocation.state
                    ? `${profileLocation.city}, ${profileLocation.state}`
                    : 'Set your area in Details'}
                </p>
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="ZIP"
                  placeholder="78701"
                  value={profileLocation.zip}
                  onChange={zip => onZipChange(sanitizeZipInput(zip))}
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={5}
                  required
                  error={shopZipError ? 'Required' : undefined}
                />
              </div>
            </div>
          </div>
        ) : null}

        {showMobileHint ? (
          <p className="mt-4 border-t border-white/[0.06] pt-4 text-xs text-zinc-500">
            {trimmedCoverage ? (
              <>
                {showShopFields ? 'Mobile jobs use' : 'Your area:'}{' '}
                <span className="text-zinc-400">{trimmedCoverage}</span>
                <span className="text-zinc-600"> · edit in Details</span>
              </>
            ) : (
              <>
                Add your city, state, and travel distance in{' '}
                <span className="text-zinc-400">Details</span>.
              </>
            )}
          </p>
        ) : null}
      </GlassCard>
    </div>
  );
}
