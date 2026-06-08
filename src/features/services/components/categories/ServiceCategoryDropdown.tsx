'use client';

import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getCategoryNameById } from './getCategoryNameById';
import type { ServiceCategoryRow } from './categoryTypes';

export interface ServiceCategoryDropdownProps {
  categories: ServiceCategoryRow[];
  selectedCategoryId: string | null;
  onSelect: (categoryId: string | null) => void;
  label?: string;
  disabled?: boolean;
}

/**
 * Click-to-open category picker — lists all categories plus "No category".
 */
export const ServiceCategoryDropdown: React.FC<
  ServiceCategoryDropdownProps
> = ({
  categories,
  selectedCategoryId,
  onSelect,
  label = 'Assign to category',
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const sortedCategories = useMemo(
    () =>
      [...categories].sort((a, b) => {
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
        return a.created_at.localeCompare(b.created_at);
      }),
    [categories]
  );

  const displayLabel =
    getCategoryNameById(categories, selectedCategoryId) ?? 'No category';

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const handleSelect = (categoryId: string | null) => {
    onSelect(categoryId);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {label ? (
        <span className="block text-sm font-semibold text-gray-200 mb-2.5">
          {label}
        </span>
      ) : null}

      <button
        type="button"
        onClick={() => !disabled && setOpen(prev => !prev)}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={label}
        className={`
          w-full min-h-[48px] flex items-center justify-between gap-2
          px-3.5 py-2.5 rounded-xl
          border border-white/10 bg-white/5
          text-left text-sm font-medium text-white
          transition-colors duration-150
          focus:outline-none
          disabled:opacity-50 disabled:cursor-not-allowed
          ${!disabled ? 'hover:border-white/20 cursor-pointer' : ''}
        `}
      >
        <span className="min-w-0 flex-1 truncate">{displayLabel}</span>
        <ChevronDownIcon
          className={`h-4 w-4 text-gray-400 shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden
        />
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-label={label}
          className="absolute z-20 mt-2 w-full max-h-52 overflow-y-auto scrollbar-hide rounded-xl border border-white/10 bg-[#1a1a1a] shadow-xl shadow-black/40 py-1.5 list-none m-0"
        >
          <CategoryDropdownOption
            label="No category"
            isSelected={selectedCategoryId == null}
            onSelect={() => handleSelect(null)}
          />
          {sortedCategories.map(category => (
            <CategoryDropdownOption
              key={category.id}
              label={category.name}
              isSelected={selectedCategoryId === category.id}
              onSelect={() => handleSelect(category.id)}
            />
          ))}
        </ul>
      ) : null}
    </div>
  );
};

function CategoryDropdownOption({
  label,
  isSelected,
  onSelect,
}: {
  label: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <li role="presentation">
      <button
        type="button"
        role="option"
        aria-selected={isSelected}
        onClick={onSelect}
        className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-left text-sm transition-colors cursor-pointer touch-manipulation ${
          isSelected
            ? 'bg-white/10 text-white'
            : 'text-zinc-300 hover:bg-white/[0.06] hover:text-white'
        }`}
      >
        <span className="truncate font-medium">{label}</span>
        {isSelected ? (
          <CheckIcon
            className="h-4 w-4 text-emerald-400 shrink-0"
            aria-hidden
          />
        ) : (
          <span className="w-4 shrink-0" aria-hidden />
        )}
      </button>
    </li>
  );
}
