'use client';

import React from 'react';

type AutomationShellProps = {
  children: React.ReactNode;
};

/** Centers automation onboarding on wide screens. */
export const AutomationShell: React.FC<AutomationShellProps> = ({
  children,
}) => {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-start px-2 pt-4 pb-4 sm:px-0 sm:pt-6 lg:pt-10 lg:pb-6">
      <div className="w-full max-w-md lg:max-w-lg">{children}</div>
    </div>
  );
};
