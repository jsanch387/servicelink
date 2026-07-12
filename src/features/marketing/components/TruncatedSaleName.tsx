import React from 'react';

interface TruncatedSaleNameProps {
  name: string;
  className?: string;
  as?: 'p' | 'h4';
}

const baseClassName = 'min-w-0 truncate text-left';

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
