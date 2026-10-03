'use client';

import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type FilterMenuOption<T extends string = string> = {
  id: T;
  label: string;
};

const MENU_WIDTH = 220;

function panelStyle(trigger: HTMLElement): React.CSSProperties {
  const rect = trigger.getBoundingClientRect();
  const left = Math.min(
    Math.max(12, rect.left),
    window.innerWidth - MENU_WIDTH - 12
  );
  return {
    position: 'fixed',
    top: rect.bottom + 8,
    left,
    width: MENU_WIDTH,
    zIndex: 80,
  };
}

export function FilterMenu<T extends string>({
  options,
  value,
  onChange,
  label = 'Filter',
  menuLabel = 'Filter',
  expanded,
  onExpandedChange,
}: {
  options: readonly FilterMenuOption<T>[];
  value: T;
  onChange: (id: T) => void;
  label?: string;
  menuLabel?: string;
  /** When set, the parent owns whether the menu is open. */
  expanded?: boolean;
  onExpandedChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = expanded ?? uncontrolledOpen;
  const setOpen = (next: boolean) => {
    onExpandedChange?.(next);
    if (expanded === undefined) setUncontrolledOpen(next);
  };

  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const setOpenRef = useRef(setOpen);
  setOpenRef.current = setOpen;
  const [style, setStyle] = useState<React.CSSProperties>({});
  const selected = options.find(option => option.id === value);
  const isDefault = options[0]?.id === value;
  const ariaLabel =
    isDefault || !selected ? label : `${label}, ${selected.label}`;

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const trigger = buttonRef.current;
    const place = () => setStyle(panelStyle(trigger));
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setOpenRef.current(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenRef.current(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen(!open)}
        className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-[10px] border border-white/15 px-3.5 text-sm text-gray-200 transition-colors hover:border-white/30 hover:bg-white/[0.04]"
      >
        <span>{label}</span>
        <AdjustmentsHorizontalIcon
          className="h-4 w-4 shrink-0 text-gray-400"
          aria-hidden
        />
      </button>
      {open && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={panelRef}
              style={style}
              role="listbox"
              aria-label={menuLabel}
              className="overflow-hidden rounded-[10px] border border-white/10 bg-[#1a1a1a] shadow-lg"
            >
              {options.map((option, index) => {
                const isSelected = value === option.id;
                const edge =
                  index === 0
                    ? 'rounded-t-[9px]'
                    : index === options.length - 1
                      ? 'rounded-b-[9px]'
                      : '';
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(option.id);
                      setOpen(false);
                    }}
                    className={`w-full cursor-pointer px-3.5 py-2.5 text-left text-sm ${edge} ${
                      isSelected
                        ? 'bg-white/10 font-medium text-white'
                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
