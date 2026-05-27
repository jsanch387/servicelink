'use client';

import React from 'react';
import { AUTOMATION_PAGE_DESCRIPTION } from '../automationCopy';

export const AutomationPageHeader: React.FC = () => {
  return (
    <header className="mb-8 text-center sm:mb-10">
      <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
        Automation
      </h1>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-400 sm:text-base">
        {AUTOMATION_PAGE_DESCRIPTION}
      </p>
    </header>
  );
};
