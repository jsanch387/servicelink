'use client';

import React from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { IconButton } from '@/components/shared';
import type { DashboardHeaderProps } from '../types/dashboard';

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onMenuClick,
}) => {
  return (
    <header className="bg-neutral-800 border-b border-neutral-700">
      <div className="flex h-16 items-center px-4 sm:px-6 lg:px-8">
        {/* Mobile menu button */}
        <IconButton
          icon={<Bars3Icon />}
          onClick={onMenuClick}
          variant="ghost"
          className="lg:hidden"
          aria-label="Open sidebar"
        />

        {/* Empty space - minimal header */}
        <div className="flex-1"></div>
      </div>
    </header>
  );
};
