import { CheckYourEmailScreen } from '@/features/auth/components/CheckYourEmailScreen';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Check your email - ServiceLink',
  description: 'We sent a confirmation link. Check your inbox or spam folder.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string | string[] }>;
}) {
  const sp = await searchParams;
  const raw = sp.email;
  const email =
    typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : undefined;

  return <CheckYourEmailScreen email={email} />;
}
