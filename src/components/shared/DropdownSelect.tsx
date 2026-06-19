'use client';

import { ChevronDownIcon } from '@heroicons/react/24/outline';
import React, {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

export interface DropdownSelectOption {
  value: string;
  label: string;
}

interface DropdownSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: DropdownSelectOption[];
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
  /** Max height of the options panel (scrollable). */
  panelMaxHeightClassName?: string;
}

export function DropdownSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  required = false,
  error,
  disabled = false,
  className = '',
  panelMaxHeightClassName = 'max-h-48',
}: DropdownSelectProps) {
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();
  const selected = options.find(o => o.value === value);

  const updatePanelPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setPanelStyle({
      position: 'fixed',
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePanelPosition();
    window.addEventListener('scroll', updatePanelPosition, true);
    window.addEventListener('resize', updatePanelPosition);
    return () => {
      window.removeEventListener('scroll', updatePanelPosition, true);
      window.removeEventListener('resize', updatePanelPosition);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  const menu =
    open && typeof document !== 'undefined' ? (
      <ul
        ref={menuRef}
        id={listboxId}
        role="listbox"
        style={panelStyle}
        className={`overflow-y-auto rounded-[10px] border border-white/10 bg-[#1a1a1a] py-1 shadow-lg scrollbar-hide ${panelMaxHeightClassName}`}
      >
        {options.map(option => {
          const isSelected = option.value === value;
          return (
            <li key={option.value} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`
                  w-full cursor-pointer px-3.5 py-2.5 text-left text-sm transition-colors
                  ${isSelected ? 'bg-white/10 font-medium text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white'}
                `}
              >
                {option.label}
              </button>
            </li>
          );
        })}
      </ul>
    ) : null;

  return (
    <div ref={rootRef} className={`relative w-full ${className}`}>
      {label ? (
        <label className="mb-2.5 block text-left text-sm font-semibold text-gray-200">
          {label}
          {required ? <span className="ml-1 text-red-400">*</span> : null}
        </label>
      ) : null}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => {
          if (disabled) return;
          setOpen(prev => !prev);
        }}
        className={`
          flex w-full items-center justify-between gap-2 rounded-[10px] border px-3.5 py-2.5 text-left text-sm font-medium transition-all duration-200 touch-manipulation
          focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--dashboard-bg,#0f0f0f)]
          ${error ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 bg-white/5'}
          ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-white/20 active:bg-white/8'}
          ${selected ? 'text-white' : 'text-gray-500'}
        `}
      >
        <span className="min-w-0 truncate">
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {menu ? createPortal(menu, document.body) : null}
      {error ? <p className="mt-1 text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
