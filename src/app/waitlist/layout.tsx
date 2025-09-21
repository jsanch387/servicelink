import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Join Our Waitlist - ServiceLink',
  description: 'Join our waitlist to get early access to your FREE professional business profile. No credit card required, no spam, just updates about your business profile.',
  openGraph: {
    title: 'Join Our Waitlist - ServiceLink',
    description: 'Join our waitlist to get early access to your FREE professional business profile. No credit card required.',
    type: 'website',
  },
};

export default function WaitlistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
