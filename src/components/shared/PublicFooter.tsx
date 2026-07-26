import { ROUTES } from '@/constants/routes';
import {
  SERVICELINK_LEGAL_NAME,
  SERVICELINK_SUPPORT_EMAIL,
  SERVICELINK_SUPPORT_MAILTO,
} from '@/constants/support';
import Link from 'next/link';
import { Logo } from './Logo';

interface PublicFooterProps {
  compact?: boolean;
}

const PRODUCT_LINKS = [
  { href: ROUTES.FEATURES_PAGE, label: 'Features' },
  { href: ROUTES.PRICING_PAGE, label: 'Pricing' },
  { href: ROUTES.RESOURCES, label: 'Resources' },
  { href: ROUTES.WORKSHOP, label: 'Workshop' },
] as const;

const SUPPORT_LINKS = [
  { href: ROUTES.CONTACT_PAGE, label: 'Contact' },
] as const;

const LEGAL_LINKS = [
  { href: ROUTES.TERMS, label: 'Terms' },
  { href: ROUTES.PRIVACY, label: 'Privacy' },
] as const;

const linkClass =
  'text-sm text-gray-400 transition-colors hover:text-white cursor-pointer';

function FooterLinkColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
        {title}
      </p>
      <ul className="flex flex-col gap-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className={linkClass}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PublicFooter({ compact = false }: PublicFooterProps) {
  const year = new Date().getFullYear();

  if (compact) {
    return (
      <footer className="border-t border-[var(--dashboard-border)] bg-[var(--dashboard-bg)] px-4 py-5 sm:px-6 sm:py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" variant="full" className="opacity-60" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 sm:text-xs">
              © {year} {SERVICELINK_LEGAL_NAME}
            </p>
          </div>
          <nav
            className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
            aria-label="Footer"
          >
            {[...PRODUCT_LINKS, ...SUPPORT_LINKS, ...LEGAL_LINKS].map(
              (link) => (
                <Link key={link.href} href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              )
            )}
          </nav>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-[var(--dashboard-border)] bg-[var(--dashboard-bg)] px-4 py-12 sm:px-6 sm:py-14 md:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-10 sm:gap-12 lg:flex-row lg:items-start lg:justify-between lg:gap-16">
          <Logo size="md" variant="full" className="opacity-80" />

          <nav
            className="grid grid-cols-2 gap-8 sm:grid-cols-3 sm:gap-12"
            aria-label="Footer"
          >
            <FooterLinkColumn title="Product" links={PRODUCT_LINKS} />
            <FooterLinkColumn title="Support" links={SUPPORT_LINKS} />
            <FooterLinkColumn title="Legal" links={LEGAL_LINKS} />
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/[0.06] pt-6 sm:mt-12 sm:flex-row sm:items-center sm:justify-between sm:pt-8">
          <p className="text-xs text-gray-600">
            © {year} {SERVICELINK_LEGAL_NAME}
          </p>
          <a
            href={SERVICELINK_SUPPORT_MAILTO}
            className="text-xs text-gray-600 transition-colors hover:text-white cursor-pointer"
          >
            {SERVICELINK_SUPPORT_EMAIL}
          </a>
        </div>
      </div>
    </footer>
  );
}
