import { LoginForm } from '@/features/auth';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - ServiceLink',
  description:
    'Login to your ServiceLink account to manage your business profile.',
};

type Props = { searchParams: Promise<{ error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  return <LoginForm redirectError={params.error} />;
}
