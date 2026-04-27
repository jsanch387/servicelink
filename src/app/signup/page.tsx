import { Metadata } from 'next';
import { SignupForm } from '@/features/auth';

export const metadata: Metadata = {
  title: 'Sign Up - ServiceLink',
  description:
    'Create your ServiceLink account and start building your professional business profile.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignupPage() {
  return <SignupForm />;
}
