'use client';

import { Button } from '@/components/shared';
import {
  getSpecialtiesForBusinessType,
  specialtiesAllowedForBusinessType,
} from '@/constants/businessSpecialties';
import { HomeIcon, TruckIcon } from '@heroicons/react/24/outline';
import type { ReactNode } from 'react';
import { PreviewActionBar } from './PreviewActionBar';

const INDUSTRIES: {
  value: string;
  label: string;
  icon: ReactNode;
}[] = [
  {
    value: 'Vehicle Services',
    label: 'Vehicle services',
    icon: <TruckIcon className="h-6 w-6" aria-hidden />,
  },
  {
    value: 'Property Services',
    label: 'Home services',
    icon: <HomeIcon className="h-6 w-6" aria-hidden />,
  },
  {
    value: 'Pet Services',
    label: 'Pet services',
    icon: <PawIcon className="h-6 w-6" />,
  },
];

interface PreviewStepIndustryProps {
  compact: boolean;
  industry: string;
  trades: string[];
  saving?: boolean;
  error?: string | null;
  onIndustry: (value: string) => void;
  onTrades: (trades: string[]) => void;
  onContinue: () => void;
}

export function PreviewStepIndustry({
  compact,
  industry,
  trades,
  saving = false,
  error,
  onIndustry,
  onTrades,
  onContinue,
}: PreviewStepIndustryProps) {
  const options = industry ? getSpecialtiesForBusinessType(industry) : [];
  const canContinue = industry.trim().length > 0 && trades.length > 0;

  const selectIndustry = (value: string) => {
    onIndustry(value);
    onTrades(specialtiesAllowedForBusinessType(value, trades));
  };

  const toggleTrade = (slug: string) => {
    if (trades.includes(slug)) {
      onTrades(trades.filter(item => item !== slug));
      return;
    }
    onTrades([...trades, slug]);
  };

  return (
    <div className="onboarding-preview-rise">
      <p className="text-sm text-white/60">Step 1 of 2</p>
      <div className="mt-2 flex gap-1" aria-hidden>
        <div className="h-1 flex-1 rounded-full bg-white" />
        <div className="h-1 flex-1 rounded-full bg-white/15" />
      </div>

      <h1
        className={
          compact
            ? 'mt-6 text-2xl font-bold tracking-tight text-white'
            : 'mt-6 text-xl font-bold tracking-tight text-white sm:text-2xl md:text-3xl'
        }
      >
        What kind of work do you do?
      </h1>

      <div
        className={
          compact
            ? 'mt-6 grid grid-cols-1 gap-3'
            : 'mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3'
        }
      >
        {INDUSTRIES.map(item => {
          const selected = industry === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => selectIndustry(item.value)}
              aria-pressed={selected}
              className={`flex min-h-[88px] cursor-pointer flex-col items-start justify-between rounded-2xl px-4 py-4 text-left transition-colors ${
                selected
                  ? 'bg-white text-black'
                  : 'border border-white/[0.08] bg-white/[0.03] text-white hover:bg-white/[0.06]'
              }`}
            >
              {item.icon}
              <span className="mt-4 text-sm font-semibold">{item.label}</span>
            </button>
          );
        })}
      </div>

      {options.length > 0 ? (
        <div key={industry} className="onboarding-preview-rise mt-8">
          <p className="text-sm font-medium text-white">Select your trades</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {options.map(option => {
              const selected = trades.includes(option.slug);
              return (
                <button
                  key={option.slug}
                  type="button"
                  onClick={() => toggleTrade(option.slug)}
                  aria-pressed={selected}
                  className={`cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                    selected
                      ? 'bg-white text-black'
                      : 'bg-white/10 text-white hover:bg-white/15'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

      <PreviewActionBar compact={compact}>
        <Button
          type="button"
          variant="primary"
          size="md"
          fullWidth={compact}
          loading={saving}
          disabled={!canContinue || saving}
          onClick={onContinue}
          className={
            compact ? '' : 'w-full sm:ml-auto sm:w-auto sm:min-w-[140px]'
          }
        >
          Continue
        </Button>
      </PreviewActionBar>
    </div>
  );
}

function PawIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <circle cx="6.2" cy="8.2" r="1.7" />
      <circle cx="10" cy="5.2" r="1.7" />
      <circle cx="14.4" cy="5.2" r="1.7" />
      <circle cx="18" cy="8.6" r="1.7" />
      <path d="M12.1 10.2c-2.7 0-5 1.9-5 4.3 0 2.1 2 3.7 5 3.7s5-1.6 5-3.7c0-2.4-2.3-4.3-5-4.3z" />
    </svg>
  );
}
