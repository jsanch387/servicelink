'use client';

import {
  hasMapTilerBrowserKey,
  searchMapTilerLocations,
} from '@/features/location/api/mapTilerGeocoding';
import type { StructuredLocation } from '@/features/location/types/location';
import { isAbortError } from '@/features/location/utils/isAbortError';
import React, { useEffect, useState } from 'react';

/** Street row with address suggestions. Picking one fills city, state, and ZIP. */
export function BookingDetailsStreetField({
  label,
  value,
  placeholder,
  onChange,
  onPick,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (street: string) => void;
  onPick: (location: StructuredLocation) => void;
}) {
  const [suggestions, setSuggestions] = useState<StructuredLocation[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const query = value.trim();
    if (!open || query.length < 3 || !hasMapTilerBrowserKey()) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void searchMapTilerLocations(query, 'street-address', controller.signal)
        .then(next => {
          if (!controller.signal.aborted) setSuggestions(next.slice(0, 5));
        })
        .catch(error => {
          if (!isAbortError(error)) setSuggestions([]);
        });
    }, 400);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [open, value]);

  return (
    <div className="relative">
      <label className="block px-4 py-3">
        <span className="block text-[13px] leading-4 text-[#8F8F8F]">
          {label}
        </span>
        <input
          value={value}
          placeholder={placeholder}
          autoComplete="street-address"
          onChange={event => onChange(event.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          className="mt-1 w-full bg-transparent text-[16px] leading-5 text-white outline-none placeholder:text-[#6B6B6B]"
        />
      </label>
      {open && suggestions.length > 0 ? (
        <ul className="absolute left-3 right-3 top-full z-30 overflow-hidden rounded-xl border border-[#262626] bg-[#141414] shadow-lg">
          {suggestions.map(location => (
            <li key={location.providerId}>
              <button
                type="button"
                onMouseDown={event => event.preventDefault()}
                onClick={() => {
                  onPick(location);
                  setOpen(false);
                  setSuggestions([]);
                }}
                className="w-full cursor-pointer px-3 py-2.5 text-left text-[14px] text-white hover:bg-white/5"
              >
                {location.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
