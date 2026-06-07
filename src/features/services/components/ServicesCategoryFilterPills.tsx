'use client';

import { FilterPills, type FilterPillOption } from '@/components/shared';
import React from 'react';

export interface ServicesCategoryFilterPillsProps {
  options: FilterPillOption<string>[];
  value: string;
  onChange: (id: string) => void;
}

export const ServicesCategoryFilterPills: React.FC<
  ServicesCategoryFilterPillsProps
> = ({ options, value, onChange }) => {
  return (
    <FilterPills
      options={options}
      value={value}
      onChange={onChange}
      ariaLabel="Filter services by category"
      compactOnMobile
      className="mb-0"
    />
  );
};
