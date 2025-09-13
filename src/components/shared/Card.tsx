import React from 'react';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  padding?: 'sm' | 'md' | 'lg';
  className?: string;
  gradient?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  gradient = false,
}) => {
  const baseClasses = 'rounded-lg border';

  const variantClasses = {
    default: 'bg-neutral-800 border-neutral-700',
    success: gradient
      ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20'
      : 'bg-green-500/10 border-green-500/20',
    warning: gradient
      ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20'
      : 'bg-yellow-500/10 border-yellow-500/20',
    danger: gradient
      ? 'bg-gradient-to-r from-red-500/10 to-pink-500/10 border-red-500/20'
      : 'bg-red-500/10 border-red-500/20',
    info: gradient
      ? 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20'
      : 'bg-blue-500/10 border-blue-500/20',
  };

  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`;

  return <div className={classes}>{children}</div>;
};
