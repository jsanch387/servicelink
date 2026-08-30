'use client';

import Link from 'next/link';
import type { ComponentType, SVGProps } from 'react';

interface DashboardSidebarNavItemProps {
  name: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  isActive: boolean;
  collapsed: boolean;
  onNavigate: () => void;
}

export function DashboardSidebarNavItem({
  name,
  href,
  icon: Icon,
  isActive,
  collapsed,
  onNavigate,
}: DashboardSidebarNavItemProps) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={collapsed ? name : undefined}
      aria-current={isActive ? 'page' : undefined}
      aria-label={name}
      className={`group flex items-center rounded-xl text-sm font-medium tracking-tight transition-colors cursor-pointer ${
        collapsed
          ? 'gap-3 px-3 py-2 lg:justify-center lg:gap-0 lg:px-0 lg:py-2.5'
          : 'gap-3 px-3 py-2'
      } ${
        isActive
          ? 'bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
          : 'text-zinc-400 hover:bg-white/[0.045] hover:text-white'
      }`}
    >
      <Icon
        className={`h-5 w-5 shrink-0 transition-colors ${
          isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-200'
        }`}
      />
      <span className={`min-w-0 truncate ${collapsed ? 'lg:sr-only' : ''}`}>
        {name}
      </span>
    </Link>
  );
}
