import { SubscriptionsBetaNotice } from '@/features/subscriptions/components/SubscriptionsBetaNotice';

export default function SubscriptionsDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <SubscriptionsBetaNotice />
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
