import type { Viewport } from 'next';
import type { ReactNode } from 'react';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  colorScheme: 'dark',
  themeColor: '#0f0f0f',
};

export default function PublicPaymentLinkLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
