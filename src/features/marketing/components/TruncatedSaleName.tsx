import React from 'react';

interface TruncatedSaleNameProps {
  name: string;
  className?: string;
  as?: 'p' | 'h4';
}

/** Alignment comes from `className` (e.g. text-center in previews, text-left in lists). */
const baseClassName = 'min-w-0 truncate';

export const TruncatedSaleName: React.FC<TruncatedSaleNameProps> = ({
  name,
  className = '',
  as: Tag = 'p',
}) => {
  return (
    <Tag className={`${baseClassName} ${className}`.trim()} title={name}>
      {name}
    </Tag>
  );
};
