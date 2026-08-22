'use client';

import type { BusinessSpecialtyOption } from '@/constants/businessSpecialties';

interface SpecialtyChipsProps {
  options: readonly BusinessSpecialtyOption[];
  value: readonly string[];
  onChange: (next: string[]) => void;
}

export function SpecialtyChips({
  options,
  value,
  onChange,
}: SpecialtyChipsProps) {
  const selected = new Set(value);

  const toggle = (slug: string) => {
    if (selected.has(slug)) {
      onChange(value.filter(item => item !== slug));
      return;
    }
    onChange([...value, slug]);
  };

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-gray-200">
        What do people hire you for?
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map(option => {
          const isOn = selected.has(option.slug);
          return (
            <button
              key={option.slug}
              type="button"
              onClick={() => toggle(option.slug)}
              className={`cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                isOn
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white hover:bg-white/15'
              }`}
              aria-pressed={isOn}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-gray-500">
        Pick all that apply. You can change this later.
      </p>
    </div>
  );
}
