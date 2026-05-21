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
  'aria-label'?: string;
  title?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'sm',
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
  'aria-label': ariaLabel,
  title,
}) => {
  // Modern rectangular rounded buttons — consistent across the app
  const baseClasses =
    'inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0f0f0f] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer select-none';

  const variantClasses = {
    primary:
      'bg-orange-500 hover:bg-orange-600 text-white shadow-sm focus:ring-orange-500',
    secondary:
      'border border-white/20 text-white bg-white/5 hover:bg-white/10 hover:border-white/30 focus:ring-white/40 backdrop-blur-sm',
    outline:
      'border border-orange-500/50 text-orange-400 bg-transparent hover:bg-orange-500/10 hover:border-orange-400 focus:ring-orange-500',
    ghost:
      'text-gray-300 hover:text-white hover:bg-white/5 focus:ring-neutral-500',
    inverse:
      'bg-white text-neutral-900 hover:bg-gray-100 shadow-sm focus:ring-neutral-400',
    danger:
      'border border-red-400/30 bg-red-500/12 text-red-200 hover:bg-red-500/18 hover:border-red-400/45 focus:ring-red-400/40 backdrop-blur-sm',
    success:
      'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm focus:ring-emerald-500',
    warning:
      'bg-amber-500 hover:bg-amber-600 text-black shadow-sm focus:ring-amber-500',
  };

  // Generous touch targets, clear hierarchy
  const sizeClasses = {
    xs: 'px-3 py-1.5 text-xs min-h-[36px]',
    sm: 'px-4 py-2 text-sm min-h-[42px]',
    md: 'px-5 py-2.5 text-sm min-h-[48px]',
    lg: 'px-6 py-3.5 text-base min-h-[52px]',
  };

  const iconSizeClasses = {
    xs: 'h-3.5 w-3.5',
    sm: 'h-4 w-4',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`;

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
      <Link
        href={href}
        className={classes}
        onClick={onClick}
        aria-label={ariaLabel}
        title={title}
      >
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
      aria-label={ariaLabel}
      title={title}
    >
      {content}
    </button>
  );
};
