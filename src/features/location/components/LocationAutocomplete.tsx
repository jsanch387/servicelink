'use client';

import {
  hasMapTilerBrowserKey,
  searchMapTilerLocations,
} from '../api/mapTilerGeocoding';
import type {
  LocationAutocompleteMode,
  StructuredLocation,
} from '../types/location';
import {
  ArrowTurnDownLeftIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import React, { useEffect, useId, useRef, useState } from 'react';

const MIN_AUTOCOMPLETE_QUERY_LENGTH = 3;
const AUTOCOMPLETE_DEBOUNCE_MS = 450;

interface LocationAutocompleteProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (location: StructuredLocation) => void;
  mode: LocationAutocompleteMode;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  variant?: 'default' | 'bare';
}

export function LocationAutocomplete({
  id,
  value,
  onChange,
  onSelect,
  mode,
  label,
  placeholder = 'Search for a location',
  required = false,
  error,
  variant = 'default',
}: LocationAutocompleteProps) {
  const listboxId = useId();
  const suppressSearchUntilEditRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [suggestions, setSuggestions] = useState<StructuredLocation[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCompletedSearch, setHasCompletedSearch] = useState(false);
  const [providerError, setProviderError] = useState('');
  const trimmedValue = value.trim();
  const showSuggestions =
    isFocused &&
    trimmedValue.length >= MIN_AUTOCOMPLETE_QUERY_LENGTH &&
    (isLoading ||
      hasCompletedSearch ||
      Boolean(providerError) ||
      suggestions.length > 0);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useEffect(() => {
    if (suppressSearchUntilEditRef.current) {
      setSuggestions([]);
      setProviderError('');
      setHasCompletedSearch(false);
      return;
    }

    if (!isFocused || trimmedValue.length < MIN_AUTOCOMPLETE_QUERY_LENGTH) {
      setSuggestions([]);
      setProviderError('');
      setIsLoading(false);
      setHasCompletedSearch(false);
      return;
    }

    if (!hasMapTilerBrowserKey()) {
      setProviderError('Location suggestions are not configured.');
      setSuggestions([]);
      setHasCompletedSearch(false);
      return;
    }

    const controller = new AbortController();
    setSuggestions([]);
    setActiveIndex(-1);
    setHasCompletedSearch(false);
    const timeout = window.setTimeout(async () => {
      setIsLoading(true);
      setProviderError('');

      try {
        const locations = await searchMapTilerLocations(
          trimmedValue,
          mode,
          controller.signal
        );
        setSuggestions(locations);
        setActiveIndex(-1);
        setHasCompletedSearch(true);
      } catch (requestError) {
        if (
          requestError instanceof DOMException &&
          requestError.name === 'AbortError'
        ) {
          return;
        }
        setSuggestions([]);
        setProviderError('Location suggestions are unavailable.');
        setHasCompletedSearch(false);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, AUTOCOMPLETE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [isFocused, mode, trimmedValue]);

  const pickLocation = (location: StructuredLocation) => {
    suppressSearchUntilEditRef.current = true;
    setSuggestions([]);
    setActiveIndex(-1);
    setProviderError('');
    setHasCompletedSearch(false);
    onSelect(location);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex(current => (current + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex(current =>
        current <= 0 ? suggestions.length - 1 : current - 1
      );
    } else if (event.key === 'Enter') {
      event.preventDefault();
      pickLocation(suggestions[activeIndex >= 0 ? activeIndex : 0]);
    } else if (event.key === 'Escape') {
      setIsFocused(false);
    }
  };

  const inputClasses =
    variant === 'bare'
      ? 'w-full min-w-0 border-0 bg-transparent p-0 pr-9 text-base leading-7 text-white outline-none placeholder:text-gray-500'
      : `w-full rounded-lg border bg-white/5 py-2.5 pl-3.5 pr-11 text-base font-normal text-white outline-none transition-all duration-200 placeholder:text-gray-500 focus:border-white/30 focus:bg-white/[0.08] focus:ring-2 focus:ring-white/20 sm:text-sm ${
          error
            ? 'border-red-500/50 bg-red-500/5'
            : 'border-white/10 hover:border-white/20'
        }`;
  const dropdownPositionClasses =
    variant === 'bare' ? '-left-8 right-0 sm:-left-9' : 'left-0 right-0';

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-left text-sm font-medium text-gray-200"
        >
          {label}
          {required && <span className="ml-1 text-red-400">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          onChange={event => {
            suppressSearchUntilEditRef.current = false;
            setIsFocused(true);
            onChange(event.target.value);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          spellCheck={false}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
          aria-controls={listboxId}
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
          }
          aria-invalid={Boolean(error)}
          className={inputClasses}
        />

        {value && (
          <button
            type="button"
            aria-label="Clear location"
            onMouseDown={event => event.preventDefault()}
            onClick={() => {
              suppressSearchUntilEditRef.current = false;
              onChange('');
              setSuggestions([]);
              setActiveIndex(-1);
              setProviderError('');
              setHasCompletedSearch(false);
              setIsFocused(true);
              inputRef.current?.focus();
            }}
            className={`absolute top-1/2 flex -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-zinc-400 transition-all hover:border-white/20 hover:bg-white/[0.14] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${
              variant === 'bare' ? 'right-0 h-7 w-7' : 'right-2.5 h-7 w-7'
            }`}
          >
            <XMarkIcon className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>

      {showSuggestions && (
        <div
          className={`absolute top-full z-[80] mt-2 overflow-hidden rounded-[1.75rem] border border-black/10 bg-[#f4f1ea]/[0.98] shadow-[0_24px_80px_rgba(0,0,0,0.5)] ring-1 ring-white/20 backdrop-blur-2xl sm:mt-3 ${dropdownPositionClasses}`}
        >
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/70 to-transparent"
            aria-hidden
          />

          {suggestions.length > 0 && !providerError && (
            <div className="relative flex items-center justify-between px-5 pb-2 pt-4">
              <span className="text-xs font-semibold text-zinc-500">
                Suggested locations
              </span>
              <span className="hidden items-center gap-1.5 text-[10px] text-zinc-400 sm:flex">
                <span>↑↓ Navigate</span>
                <span className="text-zinc-300">•</span>
                <span>Enter to select</span>
              </span>
            </div>
          )}

          <div
            id={listboxId}
            role="listbox"
            className="relative max-h-[min(18rem,36dvh)] space-y-1 overflow-y-auto overscroll-contain px-2.5 pb-2.5 sm:max-h-[min(16rem,30dvh)]"
          >
            {isLoading && suggestions.length === 0 ? (
              <div className="flex items-center gap-3 rounded-[1.35rem] px-3 py-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/[0.08] bg-black/[0.035]">
                  <MagnifyingGlassIcon className="h-4 w-4 animate-pulse text-zinc-500" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-zinc-900">
                    Finding locations
                  </span>
                  <span className="mt-0.5 block text-xs text-zinc-500">
                    Searching near you…
                  </span>
                </span>
              </div>
            ) : providerError ? (
              <div
                className="flex items-center gap-3 rounded-[1.35rem] border border-red-200 bg-red-50/80 px-3 py-3.5"
                role="alert"
              >
                <ExclamationCircleIcon className="h-5 w-5 shrink-0 text-red-500" />
                <span className="text-sm text-red-700">{providerError}</span>
              </div>
            ) : suggestions.length === 0 ? (
              <div className="flex items-center gap-3 rounded-[1.35rem] px-3 py-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/[0.08] bg-black/[0.03]">
                  <MapPinIcon className="h-4 w-4 text-zinc-500" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-zinc-900">
                    No locations found
                  </span>
                  <span className="mt-0.5 block text-xs text-zinc-500">
                    Check the spelling or try a nearby ZIP code.
                  </span>
                </span>
              </div>
            ) : (
              suggestions.map((location, index) => (
                <button
                  key={location.providerId}
                  id={`${listboxId}-option-${index}`}
                  type="button"
                  role="option"
                  aria-selected={activeIndex === index}
                  onMouseDown={event => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => pickLocation(location)}
                  className={`group/option flex min-h-[58px] w-full cursor-pointer items-center gap-3 rounded-[1.35rem] border px-3 py-2.5 text-left transition-all duration-150 sm:min-h-[62px] ${
                    activeIndex === index
                      ? 'border-zinc-950 bg-zinc-950 shadow-lg shadow-black/20'
                      : 'border-transparent hover:border-zinc-950 hover:bg-zinc-950 hover:shadow-lg hover:shadow-black/15'
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      activeIndex === index
                        ? 'border-white/15 bg-white/10 text-white'
                        : 'border-black/[0.08] bg-black/[0.035] text-zinc-500 group-hover/option:border-white/15 group-hover/option:bg-white/10 group-hover/option:text-white'
                    }`}
                  >
                    <MapPinIcon className="h-[1.05rem] w-[1.05rem]" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span
                        className={`truncate text-sm font-semibold tracking-[-0.01em] transition-colors ${
                          activeIndex === index
                            ? 'text-white'
                            : 'text-zinc-950 group-hover/option:text-white'
                        }`}
                      >
                        {location.city}, {location.state}
                      </span>
                      {location.zip && (
                        <span
                          className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide transition-colors ${
                            activeIndex === index
                              ? 'border-white/15 bg-white/10 text-zinc-300'
                              : 'border-black/[0.08] bg-black/[0.035] text-zinc-500 group-hover/option:border-white/15 group-hover/option:bg-white/10 group-hover/option:text-zinc-300'
                          }`}
                        >
                          {location.zip}
                        </span>
                      )}
                    </span>
                    <span
                      className={`mt-1 block truncate text-xs transition-colors ${
                        activeIndex === index
                          ? 'text-zinc-400'
                          : 'text-zinc-500 group-hover/option:text-zinc-400'
                      }`}
                    >
                      {location.label}
                    </span>
                  </span>

                  <ArrowTurnDownLeftIcon
                    className={`hidden h-4 w-4 shrink-0 transition-opacity sm:block ${
                      activeIndex === index
                        ? 'text-zinc-400 opacity-100'
                        : 'text-zinc-500 opacity-0 group-hover/option:text-zinc-400 group-hover/option:opacity-100'
                    }`}
                    aria-hidden
                  />
                </button>
              ))
            )}
          </div>

          <div className="relative flex items-center justify-between px-5 pb-3.5 pt-1 text-[10px] text-zinc-500">
            <span>US locations only</span>
            <span>
              Search by{' '}
              <span className="font-bold text-zinc-700">MapTiler</span>
            </span>
          </div>
        </div>
      )}

      {error && variant === 'default' && (
        <p className="mt-1 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
