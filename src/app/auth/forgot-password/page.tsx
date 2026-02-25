import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forgot Password - ServiceLink',
  description: 'Reset your ServiceLink account password.',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
