import React from 'react';

interface SectionTitleProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({
  children,
  icon,
  className = '',
}) => {
  return (
    <h2
      className={`text-2xl sm:text-3xl font-bold text-gray-50 mb-6 flex items-center ${className}`}
    >
      {icon && <span className="mr-3">{icon}</span>}
      {children}
    </h2>
  );
};
