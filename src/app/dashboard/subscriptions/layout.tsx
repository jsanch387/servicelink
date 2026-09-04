import { SubscriptionsBetaNotice } from '@/features/subscriptions/components/SubscriptionsBetaNotice';

export default function SubscriptionsDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SubscriptionsBetaNotice />
      {children}
    </>
  );
}
