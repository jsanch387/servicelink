'use client';

import Link from 'next/link';
import type { ComponentType, SVGProps } from 'react';

interface DashboardSidebarNavItemProps {
  name: string;
  href?: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  isActive?: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
  onClick?: () => void;
  disabled?: boolean;
}

export function DashboardSidebarNavItem({
  name,
  href,
  icon: Icon,
  isActive = false,
  collapsed,
  onNavigate,
  onClick,
  disabled = false,
}: DashboardSidebarNavItemProps) {
  const className = `group flex w-full items-center rounded-lg text-[15px] leading-5 font-medium tracking-tight transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
    collapsed
      ? 'gap-3.5 px-3 py-2.5 lg:justify-center lg:gap-0 lg:px-0 lg:py-2.5'
      : 'gap-3.5 px-3 py-2.5'
  } ${
    isActive
      ? 'bg-white/[0.08] text-white'
      : 'text-zinc-400 hover:bg-white/[0.045] hover:text-white'
  }`;

  const content = (
    <>
      <Icon
        className={`h-[22px] w-[22px] shrink-0 transition-colors ${
          isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-200'
        }`}
      />
      <span
        className={`flex min-w-0 flex-1 items-center gap-2 ${collapsed ? 'lg:sr-only' : ''}`}
      >
        <span className="min-w-0 truncate">{name}</span>
      </span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={collapsed ? name : undefined}
        aria-label={name}
        className={className}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={href ?? '#'}
      onClick={onNavigate}
      title={collapsed ? name : undefined}
      aria-current={isActive ? 'page' : undefined}
      aria-label={name}
      className={className}
    >
      {content}
    </Link>
  );
}
