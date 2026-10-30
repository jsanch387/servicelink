'use client';

import {
  fieldBoxClassName,
  fieldLabelClassName,
} from '@/components/shared/fieldStyles';
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import React, {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  ASSIGNABLE_TEAM_ROLES,
  teamRoleCopy,
  type AssignableTeamRole,
} from '../constants/teamRoles';

interface TeamRoleSelectProps {
  value: AssignableTeamRole;
  onChange: (role: AssignableTeamRole) => void;
  disabled?: boolean;
  error?: string;
}

export function TeamRoleSelect({
  value,
  onChange,
  disabled = false,
  error,
}: TeamRoleSelectProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const labelId = useId();
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const selected = teamRoleCopy(value);

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const button = buttonRef.current;
      if (!button) return;
      const rect = button.getBoundingClientRect();
      const gap = 8;
      const menuHeight = menuRef.current?.offsetHeight ?? 240;
      const spaceBelow = window.innerHeight - rect.bottom - gap;
      const spaceAbove = rect.top - gap;
      const openUp = spaceBelow < menuHeight && spaceAbove > spaceBelow;
      setMenuStyle({
        position: 'fixed',
        top: openUp ? undefined : rect.bottom + gap,
        bottom: openUp ? window.innerHeight - rect.top + gap : undefined,
        left: rect.left,
        width: rect.width,
        zIndex: 200,
        maxHeight: Math.max(160, openUp ? spaceAbove : spaceBelow),
        overflowY: 'auto',
      });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const menu =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="listbox"
            aria-label="Role"
            style={menuStyle}
            className="overflow-y-auto rounded-[14px] border border-white/[0.08] bg-[#1c1c1c] p-1 shadow-[0_16px_40px_rgba(0,0,0,0.45)] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-200"
          >
            {ASSIGNABLE_TEAM_ROLES.map(option => {
              const copy = teamRoleCopy(option);
              const isSelected = option === value;
              return (
                <button
                  key={option}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-[10px] px-3 py-2.5 text-left ${
                    isSelected ? 'bg-white/[0.06]' : 'hover:bg-white/[0.04]'
                  }`}
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-white">
                      {copy.label}
                    </span>
                    <span className="mt-0.5 block text-sm leading-relaxed text-white/60">
                      {copy.description}
                    </span>
                  </span>
                  {isSelected ? (
                    <CheckIcon
                      className="h-4 w-4 shrink-0 text-white"
                      aria-hidden
                    />
                  ) : (
                    <span className="h-4 w-4 shrink-0" aria-hidden />
                  )}
                </button>
              );
            })}
          </div>,
          document.body
        )
      : null;

  return (
    <div>
      <p id={labelId} className={fieldLabelClassName}>
        Role
      </p>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        aria-labelledby={labelId}
        onClick={() => setOpen(current => !current)}
        className={`flex w-full cursor-pointer items-center justify-between gap-2 text-left text-base text-white sm:text-sm disabled:cursor-not-allowed disabled:opacity-60 ${fieldBoxClassName} ${
          error ? 'border-red-500/50 bg-red-500/5' : 'hover:border-white/25'
        }`}
      >
        <span className="min-w-0 truncate">{selected.label}</span>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 text-white/60 transition-transform duration-200 motion-reduce:transition-none ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden
        />
      </button>
      {error ? (
        <p className="mt-2 text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : (
        <p className="mt-2 text-sm leading-relaxed text-white/60">
          {selected.description}
        </p>
      )}
      {menu}
    </div>
  );
}
