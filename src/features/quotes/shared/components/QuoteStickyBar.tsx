'use client';

import React from 'react';

interface QuoteStickyBarProps {
  children: React.ReactNode;
  containerClassName?: string;
  /** Use when dashboard sidebar offset is needed. */
  withDesktopSidebarOffset?: boolean;
}

export const QuoteStickyBar: React.FC<QuoteStickyBarProps> = ({
  children,
  containerClassName = 'max-w-xl',
  withDesktopSidebarOffset = false,
}) => {
  return (
    <div
      className={`safe-area-pb fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-[var(--dashboard-bg)]/95 p-4 backdrop-blur-sm ${
        withDesktopSidebarOffset ? 'lg:left-64' : ''
      }`}
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      <div className={`mx-auto w-full ${containerClassName}`}>{children}</div>
    </div>
  );
};

export default QuoteStickyBar;
