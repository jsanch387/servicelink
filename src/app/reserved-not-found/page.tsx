import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Internal rewrite target for reserved words with no page (`/blog`, `/help`). */
export default function ReservedPathNotFoundPage() {
  notFound();
}
