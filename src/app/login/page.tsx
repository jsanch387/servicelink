import { LoginForm } from '@/features/auth';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - ServiceLink',
  description:
    'Login to your ServiceLink account to manage your business profile.',
};

export default function LoginPage() {
  return <LoginForm />;
}
