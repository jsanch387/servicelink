import { Metadata } from 'next';
import { LoginForm } from '@/features/auth';

export const metadata: Metadata = {
  title: 'Login - ServiceLink',
  description:
    'Login to your ServiceLink account to manage your business profile.',
};

export default function LoginPage() {
  return <LoginForm />;
}
