import { ROUTES } from '@/constants/routes';
import Link from 'next/link';
import { Logo } from './Logo';

interface PublicFooterProps {
  tagline?: string;
  compact?: boolean;
  /** When true, include a link to the public marketplace hub. */
  showFindDetailers?: boolean;
}

export function PublicFooter({
  tagline = 'Built for the Pros',
  compact = false,
  showFindDetailers = false,
}: PublicFooterProps) {
  return (
    <footer
      className={`border-t border-[var(--dashboard-border)] bg-[var(--dashboard-bg)] px-4 sm:px-6 ${
        compact ? 'py-5 sm:py-6' : 'py-12 sm:py-14 md:py-16'
      }`}
    >
      <div
        className={`mx-auto max-w-7xl ${
          compact
            ? 'flex flex-col items-center gap-4 sm:flex-row sm:justify-between'
            : ''
        }`}
      >
        <div
          className={
            compact
              ? 'flex items-center gap-3'
              : 'mb-8 flex flex-col items-center sm:mb-10'
          }
        >
          <Logo
            size={compact ? 'sm' : 'md'}
            variant="full"
            className={compact ? 'opacity-60' : 'mb-4 opacity-70'}
          />
          <p
            className={`text-[10px] font-bold uppercase tracking-widest text-gray-600 sm:text-xs ${
              compact ? '' : 'mb-6'
            }`}
          >
            © 2026 ServiceLink • {tagline}
          </p>
        </div>

        <div
          className={`flex flex-wrap items-center justify-center text-xs text-gray-400 ${
            compact ? 'gap-3 sm:gap-4' : 'gap-4 sm:gap-6 sm:text-sm'
          }`}
        >
          {showFindDetailers ? (
            <>
              <Link
                href={ROUTES.FIND_DETAILERS}
                className="cursor-pointer transition-colors hover:text-white"
              >
                Find detailers
              </Link>
              <span className="text-gray-600">•</span>
            </>
          ) : null}
          <Link
            href={ROUTES.WORKSHOP}
            className="cursor-pointer transition-colors hover:text-white"
          >
            Workshop
          </Link>
          <span className="text-gray-600">•</span>
          <Link
            href={ROUTES.FEATURES_PAGE}
            className="cursor-pointer transition-colors hover:text-white"
          >
            Features
          </Link>
          <span className="text-gray-600">•</span>
          <Link
            href={ROUTES.PRICING_PAGE}
            className="cursor-pointer transition-colors hover:text-white"
          >
            Pricing
          </Link>
          <span className="text-gray-600">•</span>
          <Link
            href={ROUTES.RESOURCES}
            className="cursor-pointer transition-colors hover:text-white"
          >
            Resources
          </Link>
          <span className="text-gray-600">•</span>
          <Link
            href={ROUTES.CONTACT_PAGE}
            className="cursor-pointer transition-colors hover:text-white"
          >
            Contact
          </Link>
          <span className="text-gray-600">•</span>
          <Link
            href={ROUTES.TERMS}
            className="cursor-pointer transition-colors hover:text-white"
          >
            Terms of Service
          </Link>
          <span className="text-gray-600">•</span>
          <Link
            href={ROUTES.PRIVACY}
            className="cursor-pointer transition-colors hover:text-white"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
