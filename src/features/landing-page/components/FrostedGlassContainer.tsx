import React from 'react';

interface DisplayCardProps {
  children: React.ReactNode;
  className?: string;
}

export const DisplayCard: React.FC<DisplayCardProps> = ({
  children,
  className = '',
}) => {
  return (
    <div
      className={`bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-[2.5rem] border border-white/5 w-full overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
};
