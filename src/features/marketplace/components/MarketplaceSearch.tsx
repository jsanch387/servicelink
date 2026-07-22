'use client';

import { Button } from '@/components/shared/Button';
import { reverseGeocodeMapTilerLocation } from '@/features/location/api/mapTilerGeocoding';
import { LocationAutocomplete } from '@/features/location/components/LocationAutocomplete';
import { MagnifyingGlassIcon, MapPinIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';
import { FiNavigation } from 'react-icons/fi';

interface MarketplaceSearchProps {
  location: string;
  onLocationChange: (value: string) => void;
  onSearch: (location: string) => Promise<void>;
  isSearching?: boolean;
  searchError?: string;
  /** Tighter layout when shown above results. */
  compact?: boolean;
}

export const MarketplaceSearch: React.FC<MarketplaceSearchProps> = ({
  location,
  onLocationChange,
  onSearch,
  isSearching = false,
  searchError = '',
  compact = false,
}) => {
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (location.trim()) {
      void onSearch(location);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Location is not supported by this browser.');
      return;
    }

    setIsLocating(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      position => {
        void (async () => {
          try {
            const resolved = await reverseGeocodeMapTilerLocation(
              position.coords.latitude,
              position.coords.longitude
            );
            // Keep the exact resolved label in the input; search uses the same value.
            onLocationChange(resolved.label);
            await onSearch(resolved.searchValue || resolved.label);
          } catch (error) {
            setLocationError(
              error instanceof Error
                ? error.message
                : 'We could not find a city near your location.'
            );
          } finally {
            setIsLocating(false);
          }
        })();
      },
      error => {
        setLocationError(
          error.code === error.PERMISSION_DENIED
            ? 'Location permission was denied. Enter a city or ZIP instead.'
            : 'We could not access your location.'
        );
        setIsLocating(false);
      },
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 15_000 }
    );
  };

  return (
    <div
      className={
        compact ? 'w-full max-w-2xl' : 'mx-auto mt-10 w-full max-w-2xl sm:mt-12'
      }
    >
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 sm:min-h-14 sm:flex-row sm:items-center sm:gap-3 sm:rounded-full sm:border sm:border-white/15 sm:bg-white/[0.06] sm:p-1 sm:pl-5 sm:shadow-[0_20px_60px_rgba(0,0,0,0.28),0_0_40px_rgba(255,255,255,0.035)] sm:backdrop-blur-2xl"
      >
        <div className="flex min-h-[52px] w-full min-w-0 items-center gap-3 rounded-full border border-white/15 bg-white/[0.06] px-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)] sm:min-h-0 sm:flex-1 sm:border-0 sm:bg-transparent sm:px-0 sm:shadow-none">
          <MapPinIcon className="h-5 w-5 shrink-0 text-gray-500" />
          <LocationAutocomplete
            id="marketplace-location"
            placeholder="City or ZIP code"
            value={location}
            onChange={value => {
              onLocationChange(value);
              setLocationError('');
            }}
            onSelect={selectedLocation => {
              onLocationChange(selectedLocation.label);
              setLocationError('');
              void onSearch(selectedLocation.searchValue);
            }}
            mode="customer-search"
            required
            variant="bare"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          icon={<MagnifyingGlassIcon className="h-5 w-5" />}
          disabled={!location.trim() || isSearching || isLocating}
          loading={isSearching}
          fullWidth
          className="shrink-0 !min-h-[52px] !rounded-full !px-7 sm:!min-h-12 sm:!w-auto"
        >
          Search
        </Button>
      </form>

      <div className={`text-center ${compact ? 'mt-3' : 'mt-4'}`}>
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocating || isSearching}
          className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-300 disabled:cursor-wait disabled:opacity-60"
        >
          <FiNavigation className="h-4 w-4" />
          {isLocating ? 'Getting your location…' : 'Use my current location'}
        </button>
        {(locationError || searchError) && (
          <p className="mt-2 text-xs text-red-300/80" role="alert">
            {locationError || searchError}
          </p>
        )}
      </div>
    </div>
  );
};
