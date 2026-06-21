import Link from 'next/link';

export function ResourcesBreadcrumb() {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm text-gray-500">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <li>
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
        </li>
        <li aria-hidden className="text-gray-600">
          /
        </li>
        <li className="text-gray-400" aria-current="page">
          Resources
        </li>
      </ol>
    </nav>
  );
}
