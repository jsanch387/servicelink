import { GlassCard, WarningCallout } from '@/components/shared';
import type { UserLifecycleMetrics } from '../types/userLifecycle';

interface AdminDashboardPageProps {
  metrics: UserLifecycleMetrics;
  warning: string | null;
}

function formatGeneratedAt(isoDate: string): string {
  return new Date(isoDate).toLocaleString();
}

function LifecycleMetricCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <GlassCard
      padding="md"
      rounded="rounded-2xl"
      blurColor="bg-indigo-500"
      showBlur={true}
      className="h-full"
    >
      <p className="text-sm text-gray-400">{title}</p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
      {subtitle ? <p className="mt-1 text-xs text-gray-400">{subtitle}</p> : null}
    </GlassCard>
  );
}

export function AdminDashboardPage({ metrics, warning }: AdminDashboardPageProps) {
  return (
    <main className="flex-1 pt-6 pb-24 sm:pt-8 sm:pb-8 lg:pt-10 lg:pb-10 px-4 sm:px-6 lg:px-8 overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] min-h-screen w-full">
      <div className="max-w-6xl mx-auto w-full min-w-0">
        <div className="mb-6 sm:mb-8 lg:mb-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-400 mt-1">
            User lifecycle snapshot for quick product insights.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Last updated: {formatGeneratedAt(metrics.generatedAtIso)}
          </p>
        </div>

        {warning ? (
          <div className="mb-6">
            <WarningCallout>{warning}</WarningCallout>
          </div>
        ) : null}

        <section className="space-y-4 sm:space-y-6">
          <h2 className="text-lg sm:text-xl font-semibold text-white">
            User Lifecycle
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0">
            <LifecycleMetricCard
              title="New Signups (Today)"
              value={String(metrics.signupsToday)}
            />
            <LifecycleMetricCard
              title="New Signups (Last 7 Days)"
              value={String(metrics.signupsLast7Days)}
            />
            <LifecycleMetricCard
              title="New Signups (Last 30 Days)"
              value={String(metrics.signupsLast30Days)}
            />
            <LifecycleMetricCard
              title="Onboarding Completion Rate"
              value={`${metrics.onboardingCompletionRate}%`}
              subtitle={`${metrics.onboardingCompletedUsers}/${metrics.totalUsers} users completed onboarding`}
            />
            <LifecycleMetricCard
              title="Total Bookings"
              value={String(metrics.totalBookings)}
            />
            <LifecycleMetricCard
              title="Bookings Scheduled (Last 7 Days)"
              value={String(metrics.bookingsLast7Days)}
            />
            <LifecycleMetricCard
              title="Bookings Scheduled (Last 30 Days)"
              value={String(metrics.bookingsLast30Days)}
            />
          </div>
        </section>

        <section className="space-y-4 sm:space-y-6 mt-8">
          <h2 className="text-lg sm:text-xl font-semibold text-white">
            Subscriptions (Stripe)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 min-w-0">
            <LifecycleMetricCard
              title="Paying subscribers"
              value={String(metrics.payingActiveSubscribers)}
              subtitle="Pro tier, Stripe status active, current period not ended, linked subscription"
            />
            <LifecycleMetricCard
              title="On Pro free trial"
              value={String(metrics.proTrialSubscribers)}
              subtitle="Stripe status trialing with valid access window"
            />
          </div>
        </section>

        <section className="space-y-4 sm:space-y-6 mt-8">
          <h2 className="text-lg sm:text-xl font-semibold text-white">
            Core Product Usage
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0">
            <LifecycleMetricCard
              title="Users Who Created a Service"
              value={String(metrics.usersWithCreatedService)}
            />
            <LifecycleMetricCard
              title="Users Who Uploaded an Image"
              value={String(metrics.usersWithUploadedImage)}
            />
            <LifecycleMetricCard
              title="Users Who Completed Main Workflow"
              value={String(metrics.usersCompletedMainWorkflow)}
              subtitle="Has service + image + public link"
            />
          </div>

          {metrics.mainWorkflowCompletedUserEmails.length > 0 ? (
            <GlassCard
              padding="md"
              rounded="rounded-2xl"
              blurColor="bg-indigo-500"
              showBlur={true}
              className="min-w-0"
            >
              <h3 className="text-lg font-semibold text-white">
                Main workflow — sign-in emails
              </h3>
              <p className="mt-1 text-xs text-gray-400">
                Resolved via Supabase Auth for accounts that have a service, at least one
                image, and a public link ({metrics.mainWorkflowCompletedUserEmails.length}{' '}
                {metrics.mainWorkflowCompletedUserEmails.length === 1 ? 'address' : 'addresses'}
                ). Comma-separated — select all and copy.
              </p>
              <textarea
                readOnly
                value={metrics.mainWorkflowCompletedUserEmails.join(', ')}
                rows={4}
                className="mt-4 w-full min-h-[7rem] max-h-56 resize-y rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-gray-200 outline-none focus:ring-2 focus:ring-indigo-500/40"
                spellCheck={false}
              />
            </GlassCard>
          ) : null}

          <GlassCard
            padding="md"
            rounded="rounded-2xl"
            blurColor="bg-emerald-500"
            showBlur={true}
            className="h-full"
          >
            <h3 className="text-lg font-semibold text-white">Top 5 Most-Used Features</h3>
            <div className="mt-4 space-y-2">
              {metrics.topFeatures.map((item, index) => (
                <div
                  key={item.feature}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                >
                  <p className="text-sm text-gray-200">
                    {index + 1}. {item.feature}
                  </p>
                  <p className="text-sm font-semibold text-white">{item.users}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </section>
      </div>
    </main>
  );
}
