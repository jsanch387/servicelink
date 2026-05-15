import { LoginForm } from '@/features/auth';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - ServiceLink',
  description:
    'Login to your ServiceLink account to manage your business profile.',
  robots: {
    index: false,
    follow: false,
  },
};

type Props = {
  searchParams: Promise<{
    error?: string;
    reset?: string;
    notice?: string;
  }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  return (
    <LoginForm
      redirectError={params.error}
      resetSuccess={params.reset === 'success'}
      loginNotice={params.notice}
    />
  );
}
