'use client';

import { BetaBadge, NewBadge } from '@/components/shared';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import React, { useEffect, useId, useRef, useState } from 'react';

import type { DashboardNavItem } from '../utils/dashboardNav';
import { isDashboardNavItemActive } from '../utils/dashboardNav';

export function DashboardSidebarNavGroup({
  name,
  icon: Icon,
  items,
  pathname,
  collapsed,
  onNavigate,
}: {
  name: string;
  icon: DashboardNavItem['icon'];
  items: DashboardNavItem[];
  pathname: string;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const childActive = items.some(item =>
    isDashboardNavItemActive(pathname, item)
  );
  const [open, setOpen] = useState(childActive);

  useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive]);

  useEffect(() => {
    if (!open || !collapsed) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, collapsed]);

  const childLinks = items.map(item => {
    const active = isDashboardNavItemActive(pathname, item);
    const label =
      item.badge === 'beta'
        ? `${item.name} (Beta)`
        : item.badge === 'new'
          ? `${item.name} (New)`
          : item.name;
    return { item, active, label };
  });

  const showRail = items.length > 1;

  const renderLinks = (keyPrefix: string, withRail: boolean) =>
    childLinks.map(({ item, active, label }) => (
      <div
        key={`${keyPrefix}-${item.name}`}
        className={`relative ${withRail ? 'pl-4' : ''}`}
      >
        {withRail ? (
          <span
            aria-hidden
            className={`absolute top-1/2 left-0 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full ${
              active ? 'size-2 bg-white' : 'size-1.5 bg-zinc-500'
            }`}
          />
        ) : null}
        <Link
          href={item.href}
          aria-current={active ? 'page' : undefined}
          aria-label={label}
          onClick={() => {
            onNavigate();
            if (collapsed) setOpen(false);
          }}
          className={`flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2.5 text-[15px] leading-5 font-medium tracking-tight transition-colors ${
            active
              ? 'bg-white/10 text-white'
              : 'text-zinc-400 hover:bg-white/[0.045] hover:text-white'
          }`}
        >
          <span className="min-w-0 truncate">{item.name}</span>
          {item.badge === 'beta' ? (
            <BetaBadge className="ml-auto shrink-0" />
          ) : null}
          {item.badge === 'new' ? (
            <NewBadge className="ml-auto shrink-0" />
          ) : null}
        </Link>
      </div>
    ));

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={`group flex w-full cursor-pointer items-center rounded-xl text-[15px] leading-5 font-medium tracking-tight text-zinc-400 transition-colors hover:bg-white/[0.045] hover:text-white ${
          collapsed
            ? 'gap-3.5 px-3 py-2.5 lg:justify-center lg:gap-0 lg:px-0 lg:py-2.5'
            : 'gap-3.5 px-3 py-2.5'
        } ${childActive ? 'text-white' : ''}`}
        aria-expanded={open}
        aria-controls={menuId}
        title={collapsed ? name : undefined}
        onClick={() => setOpen(current => !current)}
      >
        <Icon
          className={`h-[22px] w-[22px] shrink-0 ${
            childActive
              ? 'text-white'
              : 'text-zinc-500 group-hover:text-zinc-200'
          }`}
        />
        <span
          className={`flex min-w-0 flex-1 items-center ${collapsed ? 'lg:sr-only' : ''}`}
        >
          <span className="truncate">{name}</span>
        </span>
        <ChevronDownIcon
          className={`h-[18px] w-[18px] shrink-0 text-zinc-500 transition-transform ${
            open ? 'rotate-180' : ''
          } ${collapsed ? 'lg:hidden' : ''}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div id={menuId} className={collapsed ? 'lg:hidden' : undefined}>
          <div className="relative mt-2 ml-[23px]">
            {showRail ? (
              <span
                aria-hidden
                className="pointer-events-none absolute top-5 bottom-5 left-0 w-px -translate-x-1/2 bg-white/15"
              />
            ) : null}
            <div className="flex flex-col gap-1.5">
              {renderLinks('inline', showRail)}
            </div>
          </div>
        </div>
      ) : null}

      {collapsed && open ? (
        <div className="absolute top-0 left-full z-50 ml-2 hidden w-48 rounded-xl border border-white/10 bg-[#1c1c1c] p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.45)] lg:block">
          <p className="px-2.5 py-1.5 text-xs font-semibold text-zinc-500">
            {name}
          </p>
          <div className="relative">
            {showRail ? (
              <span
                aria-hidden
                className="pointer-events-none absolute top-5 bottom-5 left-0 w-px -translate-x-1/2 bg-white/15"
              />
            ) : null}
            <div className="flex flex-col gap-1.5">
              {renderLinks('flyout', showRail)}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
