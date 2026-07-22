import { Logo } from '@/components/shared/Logo';
import { ROUTES } from '@/constants/routes';
import Link from 'next/link';

export function MarketplaceHeader() {
  return (
    <header className="relative z-20 border-b border-[var(--dashboard-border)] bg-[var(--dashboard-bg)]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6">
        <Logo
          href={ROUTES.FIND_DETAILERS}
          size="md"
          logoSize="sm"
          className="gap-2"
        />

        <nav
          className="flex items-center gap-2 sm:gap-4"
          aria-label="Marketplace"
        >
          <Link
            href={ROUTES.AUTH.LOGIN}
            className="hidden rounded-[10px] px-4 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-white/[0.05] hover:text-white sm:block"
          >
            Sign in
          </Link>
          <Link
            href={ROUTES.AUTH.SIGNUP}
            className="cursor-pointer whitespace-nowrap rounded-[10px] border border-white/20 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:border-white/30 hover:bg-white/[0.1] sm:px-5"
          >
            List your business
          </Link>
        </nav>
      </div>
    </header>
  );
}
