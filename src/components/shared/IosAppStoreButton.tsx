import type { ReactNode } from 'react';
import { IOS_APP_STORE_URL } from '@/constants/appStore';
import { DevicePhoneMobileIcon } from '@heroicons/react/24/outline';

type IosAppStoreButtonProps = {
  className?: string;
  children?: ReactNode;
};

/** External link to the ServiceLink iOS App Store listing. */
export function IosAppStoreButton({
  className = '',
  children = 'Get the app',
}: IosAppStoreButtonProps) {
  if (!IOS_APP_STORE_URL) return null;

  return (
    <a
      href={IOS_APP_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200 ${className}`}
    >
      <DevicePhoneMobileIcon className="h-4 w-4 shrink-0" aria-hidden />
      {children}
    </a>
  );
}
