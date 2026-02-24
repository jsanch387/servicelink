import Link from 'next/link';
import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?:
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'ghost'
    | 'inverse'
    | 'danger'
    | 'success'
    | 'warning';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  /** Associate submit/reset button with a form by id (native form attribute). */
  form?: string;
  href?: string;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  disabled = false,
  type = 'button',
  form,
  href,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
}) => {
  const baseClasses =
    'inline-flex items-center justify-center rounded-xl shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  // Default font weight - can be overridden by className
  const defaultFontWeight = className.includes('font-') ? '' : 'font-medium';

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white focus:ring-orange-500',
    secondary:
      'border border-white/20 text-white bg-white/5 hover:bg-white/10 hover:border-white/30 focus:ring-white/50 backdrop-blur-sm',
    outline:
      'border border-orange-500/50 text-orange-400 bg-transparent hover:bg-orange-500/10 hover:border-orange-400 focus:ring-orange-500',
    ghost:
      'text-gray-300 hover:text-white hover:bg-neutral-700/50 focus:ring-neutral-500',
    inverse: 'bg-white text-black hover:bg-gray-100 focus:ring-neutral-400',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
    warning:
      'bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500',
  };

  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const iconSizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const classes = `${baseClasses} ${defaultFontWeight} ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`;

  const isDisabled = disabled || loading;

  const content = (
    <span className="flex items-center justify-center gap-2">
      {loading && (
        <div
          className={`animate-spin rounded-full border-b-2 border-current ${iconSizeClasses[size]}`}
        />
      )}
      {!loading && icon && iconPosition === 'left' && (
        <span className="inline-flex items-center justify-center">{icon}</span>
      )}
      {children}
      {!loading && icon && iconPosition === 'right' && (
        <span className="inline-flex items-center justify-center">{icon}</span>
      )}
    </span>
  );

  if (href && !isDisabled) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      form={form}
      className={classes}
      onClick={onClick}
      disabled={isDisabled}
    >
      {content}
    </button>
  );
};
