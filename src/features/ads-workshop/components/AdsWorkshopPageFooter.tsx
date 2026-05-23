import Link from 'next/link';
import { ROUTES } from '@/constants/routes';

export function AdsWorkshopPageFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10 text-center border-t border-white/[0.06]">
      <p className="text-xs text-gray-500 mb-4">
        © {year} ServiceLink for Business. Built for mobile service operators.
      </p>
      <nav
        className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-gray-500"
        aria-label="Workshop footer"
      >
        <Link href="/" className="hover:text-white transition-colors">
          Home
        </Link>
        <span className="text-gray-700" aria-hidden>
          •
        </span>
        <Link
          href={ROUTES.PRICING_PAGE}
          className="hover:text-white transition-colors"
        >
          Pricing
        </Link>
        <span className="text-gray-700" aria-hidden>
          •
        </span>
        <Link
          href={ROUTES.PRIVACY}
          className="hover:text-white transition-colors"
        >
          Privacy
        </Link>
      </nav>
    </footer>
  );
}
