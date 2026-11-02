'use client';

import { ROUTES } from '@/constants/routes';
import {
  AcademicCapIcon,
  ArrowRightIcon,
  BanknotesIcon,
  BookOpenIcon,
  BriefcaseIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DevicePhoneMobileIcon,
  ScaleIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  RESOURCES_MEGA_SECTIONS,
  RESOURCES_NAV_COLUMNS,
  RESOURCES_NAV_VIEW_ALL,
  type ResourcesMegaSection,
  type ResourcesNavItem,
} from '../constants/resourcesNavLinks';
import {
  MARKETING_RESOURCES_MEGA_SLOT_ID,
  desktopNavItemClass,
} from './navStyles';

const CLOSE_DELAY_MS = 180;

const NAV_ICONS = {
  book: BookOpenIcon,
  briefcase: BriefcaseIcon,
  calendar: CalendarDaysIcon,
  compare: ScaleIcon,
  deposit: BanknotesIcon,
  instagram: DevicePhoneMobileIcon,
  start: TruckIcon,
  workshop: AcademicCapIcon,
} as const;

function useResourcesMenuOpen() {
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const openMenu = useCallback(() => {
    clearCloseTimer();
    setOpen(true);
  }, [clearCloseTimer]);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
      closeTimerRef.current = null;
    }, CLOSE_DELAY_MS);
  }, [clearCloseTimer]);

  const closeMenu = useCallback(() => {
    clearCloseTimer();
    setOpen(false);
  }, [clearCloseTimer]);

  const toggleMenu = useCallback(() => {
    clearCloseTimer();
    setOpen(prev => !prev);
  }, [clearCloseTimer]);

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  return { open, openMenu, scheduleClose, closeMenu, toggleMenu };
}

function ResourcesNavItemLink({
  item,
  onNavigate,
  trailing,
  size = 'compact',
}: {
  item: ResourcesNavItem;
  onNavigate: () => void;
  trailing?: React.ReactNode;
  size?: 'compact' | 'comfortable';
}) {
  const Icon = NAV_ICONS[item.icon];
  const comfortable = size === 'comfortable';

  return (
    <Link
      href={item.href}
      role="menuitem"
      className={`group flex items-start cursor-pointer transition-colors ${
        comfortable
          ? 'gap-3.5 rounded-2xl px-3.5 py-3.5 hover:bg-white/[0.07] active:bg-white/[0.1]'
          : 'gap-3 rounded-xl p-2.5 hover:bg-white/[0.06] active:bg-white/[0.08]'
      }`}
      onClick={onNavigate}
    >
      <span
        className={`mt-0.5 flex shrink-0 items-center justify-center text-gray-300 group-hover:text-white transition-colors ${
          comfortable
            ? 'h-11 w-11 rounded-xl bg-white/[0.08] group-hover:bg-white/[0.12]'
            : 'h-9 w-9 rounded-lg bg-white/[0.06] group-hover:bg-white/[0.1]'
        }`}
      >
        <Icon className={comfortable ? 'h-5 w-5' : 'h-4 w-4'} aria-hidden />
      </span>
      <span className="min-w-0 flex-1 pt-0.5">
        <span
          className={`block font-semibold text-white leading-snug ${
            comfortable ? 'text-[15px]' : 'text-sm'
          }`}
        >
          {item.label}
        </span>
        <span
          className={`block leading-snug ${
            comfortable
              ? 'mt-1 text-sm text-white/50'
              : 'mt-0.5 text-xs text-gray-500'
          }`}
        >
          {item.description}
        </span>
      </span>
      {trailing}
    </Link>
  );
}

function ResourcesMegaMenuPanel({
  menuId,
  open,
  onNavigate,
}: {
  menuId: string;
  open: boolean;
  onNavigate: () => void;
}) {
  const [activeId, setActiveId] = useState(RESOURCES_MEGA_SECTIONS[0].id);
  const activeSection =
    RESOURCES_MEGA_SECTIONS.find(section => section.id === activeId) ??
    RESOURCES_MEGA_SECTIONS[0];

  useEffect(() => {
    if (!open) setActiveId(RESOURCES_MEGA_SECTIONS[0].id);
  }, [open]);

  return (
    <div
      id={menuId}
      role="menu"
      aria-label="Resources"
      className={`overflow-hidden rounded-[1.75rem] border border-white/[0.12] bg-[#1a1a1a] shadow-[0_32px_80px_rgba(0,0,0,0.72)] transition-all duration-200 ease-out ${
        open
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 -translate-y-1 pointer-events-none'
      }`}
    >
      <div className="grid min-h-[22rem] grid-cols-[13.5rem_minmax(0,1fr)_18rem] lg:min-h-[24rem] lg:grid-cols-[15.5rem_minmax(0,1fr)_21rem]">
        <aside className="flex flex-col gap-1 bg-[#121212] p-3 lg:p-4">
          {RESOURCES_MEGA_SECTIONS.map(section => (
            <ResourcesMegaSectionTab
              key={section.id}
              section={section}
              active={section.id === activeId}
              onHover={() => setActiveId(section.id)}
              onNavigate={onNavigate}
            />
          ))}
        </aside>

        <div className="flex flex-col justify-center border-l border-white/[0.08] px-6 py-6 lg:px-8">
          <ul className="space-y-1">
            {activeSection.links.map(item => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  role="menuitem"
                  className="group block cursor-pointer rounded-2xl px-3 py-3.5 transition-colors hover:bg-white/[0.06]"
                  onClick={onNavigate}
                >
                  <span className="block text-[15px] font-semibold leading-snug text-white lg:text-base">
                    {item.label}
                  </span>
                  <span className="mt-1 block text-sm leading-snug text-white/45">
                    {item.description}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-l border-white/[0.08] p-3 lg:p-4">
          <ResourcesMegaFeaturedCard
            section={activeSection}
            onNavigate={onNavigate}
          />
        </div>
      </div>
    </div>
  );
}

function ResourcesMegaSectionTab({
  section,
  active,
  onHover,
  onNavigate,
}: {
  section: ResourcesMegaSection;
  active: boolean;
  onHover: () => void;
  onNavigate: () => void;
}) {
  const Icon = NAV_ICONS[section.icon];

  return (
    <Link
      href={section.href}
      role="menuitem"
      className={`group flex items-center gap-3 rounded-2xl px-3 py-3 cursor-pointer transition-colors lg:px-3.5 lg:py-3.5 ${
        active
          ? 'bg-white/[0.08] text-white'
          : 'text-white/70 hover:bg-white/[0.05] hover:text-white'
      }`}
      onMouseEnter={onHover}
      onFocus={onHover}
      onClick={onNavigate}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
          active
            ? 'bg-white/[0.1] text-white'
            : 'bg-white/[0.06] text-white/60 group-hover:text-white'
        }`}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold leading-none">
          {section.label}
        </span>
      </span>
      <ChevronRightIcon
        className={`h-4 w-4 shrink-0 transition-colors ${
          active ? 'text-white/55' : 'text-white/25 group-hover:text-white/45'
        }`}
        aria-hidden
      />
    </Link>
  );
}

function ResourcesMegaFeaturedCard({
  section,
  onNavigate,
}: {
  section: ResourcesMegaSection;
  onNavigate: () => void;
}) {
  const { featured } = section;

  return (
    <Link
      href={featured.href}
      role="menuitem"
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-[1.35rem] bg-[#222] transition-colors hover:bg-[#262626]"
      onClick={onNavigate}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={featured.image}
          alt={featured.imageAlt}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          sizes="336px"
        />
      </div>
      <div className="flex flex-1 flex-col px-4 py-4 lg:px-5 lg:py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
          {featured.eyebrow}
        </p>
        <p className="mt-2 text-[15px] font-semibold leading-snug text-white lg:text-base">
          {featured.title}
        </p>
        <p className="mt-1.5 text-sm leading-snug text-white/45">
          {featured.description}
        </p>
        <span className="mt-auto inline-flex items-center gap-2 pt-4 text-sm font-semibold text-white">
          {featured.cta}
          <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

export function ResourcesNavMenuDesktop() {
  const pathname = usePathname();
  const menuId = useId();
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const { open, openMenu, scheduleClose, closeMenu, toggleMenu } =
    useResourcesMenuOpen();
  const isActive =
    open ||
    pathname.startsWith(ROUTES.RESOURCES) ||
    pathname.startsWith(ROUTES.WORKSHOP);

  useEffect(() => {
    setPortalTarget(document.getElementById(MARKETING_RESOURCES_MEGA_SLOT_ID));
  }, []);

  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      closeMenu();
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [open, closeMenu]);

  const panel =
    portalTarget &&
    createPortal(
      <div
        ref={panelRef}
        className={`absolute inset-x-0 top-full z-40 ${
          open ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        onMouseEnter={openMenu}
        onMouseLeave={scheduleClose}
        aria-hidden={!open}
        inert={!open ? true : undefined}
      >
        <div className="h-3" aria-hidden />
        <ResourcesMegaMenuPanel
          menuId={menuId}
          open={open}
          onNavigate={closeMenu}
        />
      </div>,
      portalTarget
    );

  return (
    <div ref={triggerRef} onMouseEnter={openMenu} onMouseLeave={scheduleClose}>
      <button
        type="button"
        onClick={toggleMenu}
        className={desktopNavItemClass(isActive)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={menuId}
      >
        Resources
        <ChevronDownIcon
          className={`h-3.5 w-3.5 transition-transform duration-200 md:h-4 md:w-4 lg:h-[1.125rem] lg:w-[1.125rem] ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden
        />
      </button>
      {panel}
    </div>
  );
}

const featuredGuides =
  RESOURCES_NAV_COLUMNS.find(column => column.heading === 'Guides')?.items ??
  [];

const MOBILE_RESOURCES_LINKS: ResourcesNavItem[] = [
  ...featuredGuides,
  RESOURCES_NAV_VIEW_ALL,
];

/** Resources row that expands to the featured guides. */
export function ResourcesNavMenuMobile({
  onNavigate,
  menuOpen,
}: {
  onNavigate: () => void;
  menuOpen: boolean;
}) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  const isActive =
    pathname.startsWith(ROUTES.RESOURCES) ||
    pathname.startsWith(ROUTES.WORKSHOP);

  useEffect(() => {
    if (!menuOpen) setExpanded(false);
  }, [menuOpen]);

  return (
    <li>
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        className={`flex w-full items-center justify-between rounded-2xl px-4 py-4 text-[1.5rem] font-semibold tracking-tight leading-none cursor-pointer transition-colors focus:outline-none focus-visible:outline-none ${
          isActive || expanded
            ? 'text-white'
            : 'text-white/45 active:text-white'
        }`}
        aria-expanded={expanded}
        aria-controls={panelId}
      >
        Resources
        <ChevronDownIcon
          className={`h-5 w-5 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            expanded ? 'rotate-180 text-white' : 'text-white/40'
          }`}
          aria-hidden
        />
      </button>
      <div
        id={panelId}
        aria-hidden={!expanded}
        inert={!expanded ? true : undefined}
        className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <ul className="pb-2 pl-1">
            {MOBILE_RESOURCES_LINKS.map(item => {
              const isViewAll = item.href === RESOURCES_NAV_VIEW_ALL.href;
              return (
                <li
                  key={item.href}
                  className={
                    isViewAll ? 'mt-1 border-t border-white/[0.08] pt-1' : ''
                  }
                >
                  <ResourcesNavItemLink
                    item={item}
                    onNavigate={onNavigate}
                    trailing={
                      isViewAll ? (
                        <ArrowRightIcon
                          className="mt-2.5 h-3.5 w-3.5 shrink-0 text-white/45"
                          aria-hidden
                        />
                      ) : null
                    }
                  />
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </li>
  );
}
