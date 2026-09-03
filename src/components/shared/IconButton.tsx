import React from 'react';

interface IconButtonProps {
  icon: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseDown?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  title?: string;
  'aria-label'?: string;
  'aria-expanded'?: boolean;
  'aria-haspopup'?: React.AriaAttributes['aria-haspopup'];
  'aria-controls'?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onClick,
  onMouseDown,
  variant = 'ghost',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  title,
  'aria-label': ariaLabel,
  'aria-expanded': ariaExpanded,
  'aria-haspopup': ariaHasPopup,
  'aria-controls': ariaControls,
}) => {
  const baseClasses =
    'inline-flex items-center justify-center rounded-md transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variantClasses = {
    primary:
      'bg-orange-500 hover:bg-orange-600 text-white focus-visible:ring-orange-500',
    secondary:
      'bg-neutral-700 hover:bg-neutral-600 border border-neutral-600 text-white focus-visible:ring-blue-500',
    ghost:
      'text-gray-400 hover:text-white hover:bg-neutral-700/50 focus-visible:ring-neutral-500',
    danger:
      'text-red-400 hover:text-white hover:bg-red-600 focus-visible:ring-red-500',
    success:
      'text-green-400 hover:text-white hover:bg-green-600 focus-visible:ring-green-500',
  };

  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
  };

  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      className={classes}
      onClick={onClick}
      onMouseDown={onMouseDown}
      disabled={isDisabled}
      title={title}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      aria-haspopup={ariaHasPopup}
      aria-controls={ariaControls}
    >
      {loading ? (
        <div
          className={`animate-spin rounded-full border-b-2 border-current ${iconSizeClasses[size]}`}
        />
      ) : (
        <span className={iconSizeClasses[size]}>{icon}</span>
      )}
    </button>
  );
};
