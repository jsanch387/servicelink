import { GlassCard, WarningCallout } from '@/components/shared';
import type { UserLifecycleMetrics } from '../types/userLifecycle';

interface AdminDashboardPageProps {
  metrics: UserLifecycleMetrics;
  warning: string | null;
}

function formatGeneratedAt(isoDate: string): string {
  return new Date(isoDate).toLocaleString();
}

function formatUsdFromCents(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatSignupDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
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
      {subtitle ? (
        <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
      ) : null}
    </GlassCard>
  );
}

export function AdminDashboardPage({
  metrics,
  warning,
}: AdminDashboardPageProps) {
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

          {metrics.payingActiveSubscriberEmails.length > 0 ? (
            <GlassCard
              padding="md"
              rounded="rounded-2xl"
              blurColor="bg-indigo-500"
              showBlur={true}
              className="min-w-0"
            >
              <h3 className="text-lg font-semibold text-white">
                Paying Pro (active) — sign-in emails
              </h3>
              <p className="mt-1 text-xs text-gray-400">
                Pro tier with Stripe status active and a linked subscription (
                {metrics.payingActiveSubscriberEmails.length}{' '}
                {metrics.payingActiveSubscriberEmails.length === 1
                  ? 'address'
                  : 'addresses'}
                , {metrics.payingActiveSubscribers} subscriber
                {metrics.payingActiveSubscribers === 1 ? '' : 's'}). Comma-separated
                — select all and copy.
              </p>
              <textarea
                readOnly
                value={metrics.payingActiveSubscriberEmails.join(', ')}
                rows={4}
                className="mt-4 w-full min-h-[7rem] max-h-56 resize-y rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-gray-200 outline-none focus:ring-2 focus:ring-indigo-500/40"
                spellCheck={false}
              />
            </GlassCard>
          ) : null}
        </section>

        <section className="space-y-4 sm:space-y-6 mt-8">
          <h2 className="text-lg sm:text-xl font-semibold text-white">
            Payments adoption
          </h2>
          <p className="text-sm text-gray-400 -mt-2">
            Stripe Connect setup and whether owners collect money through
            ServiceLink checkout.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0">
            <LifecycleMetricCard
              title="Stripe Connect linked"
              value={String(metrics.stripeConnectAccounts)}
              subtitle="Businesses with a payment_accounts row"
            />
            <LifecycleMetricCard
              title="Charges enabled"
              value={String(metrics.stripeChargesEnabledAccounts)}
              subtitle="Can accept card payments on Connect"
            />
            <LifecycleMetricCard
              title="Payments turned on"
              value={String(metrics.paymentsEnabledBusinesses)}
              subtitle="payment_settings.payments_enabled"
            />
            <LifecycleMetricCard
              title="Bookings paid online"
              value={String(metrics.bookingsWithOnlinePayment)}
              subtitle="Stripe provider with deposit or full payment"
            />
            <LifecycleMetricCard
              title="Total collected online"
              value={formatUsdFromCents(metrics.totalOnlineRevenueCents)}
              subtitle="Sum of paid_online_amount_cents"
            />
            <LifecycleMetricCard
              title="Calendar booking on"
              value={String(metrics.availabilityBookingEnabled)}
            />
            <LifecycleMetricCard
              title="Quote requests on"
              value={String(metrics.quoteRequestsEnabled)}
            />
          </div>
        </section>

        <section className="space-y-4 sm:space-y-6 mt-8">
          <h2 className="text-lg sm:text-xl font-semibold text-white">
            Signup sources
          </h2>
          <p className="text-sm text-gray-400 -mt-2">
            First-touch UTM and referrer captured when someone lands on the site
            (before signup). Use{' '}
            <code className="text-gray-300">?utm_source=facebook&utm_medium=paid</code>{' '}
            on ad links. Existing users before tracking show as “Not tracked
            yet”.
          </p>

          {metrics.signupSourceBreakdown.length > 0 ? (
            <GlassCard
              padding="md"
              rounded="rounded-2xl"
              blurColor="bg-violet-500"
              showBlur={true}
            >
              <h3 className="text-lg font-semibold text-white">
                Signups by channel
              </h3>
              <div className="mt-4 space-y-2">
                {metrics.signupSourceBreakdown.map(row => (
                  <div
                    key={row.channel}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 gap-3"
                  >
                    <p className="text-sm text-gray-200">{row.channel}</p>
                    <p className="text-sm font-semibold text-white shrink-0">
                      {row.count}{' '}
                      <span className="text-gray-400 font-normal">
                        ({row.percent}%)
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </GlassCard>
          ) : null}

          {metrics.recentSignupsWithAttribution.length > 0 ? (
            <GlassCard
              padding="md"
              rounded="rounded-2xl"
              blurColor="bg-violet-500"
              showBlur={true}
              className="min-w-0 overflow-x-auto"
            >
              <h3 className="text-lg font-semibold text-white">
                Recent signups (last {metrics.recentSignupsWithAttribution.length})
              </h3>
              <table className="mt-4 w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-white/10">
                    <th className="pb-2 pr-3 font-medium">Signed up</th>
                    <th className="pb-2 pr-3 font-medium">Email</th>
                    <th className="pb-2 pr-3 font-medium">Channel</th>
                    <th className="pb-2 pr-3 font-medium">utm_source</th>
                    <th className="pb-2 pr-3 font-medium">utm_medium</th>
                    <th className="pb-2 pr-3 font-medium">utm_campaign</th>
                    <th className="pb-2 font-medium">Landing</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.recentSignupsWithAttribution.map(row => (
                    <tr
                      key={row.userId}
                      className="border-b border-white/5 text-gray-200"
                    >
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {formatSignupDate(row.signedUpAt)}
                      </td>
                      <td className="py-2 pr-3 max-w-[200px] truncate">
                        {row.email ?? '—'}
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {row.channel}
                      </td>
                      <td className="py-2 pr-3">{row.utmSource ?? '—'}</td>
                      <td className="py-2 pr-3">{row.utmMedium ?? '—'}</td>
                      <td className="py-2 pr-3 max-w-[120px] truncate">
                        {row.utmCampaign ?? '—'}
                      </td>
                      <td className="py-2 max-w-[100px] truncate">
                        {row.landingPath ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>
          ) : null}
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
                Resolved via Supabase Auth for accounts that have a service, at
                least one image, and a public link (
                {metrics.mainWorkflowCompletedUserEmails.length}{' '}
                {metrics.mainWorkflowCompletedUserEmails.length === 1
                  ? 'address'
                  : 'addresses'}
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
            <h3 className="text-lg font-semibold text-white">
              Top 5 Most-Used Features
            </h3>
            <div className="mt-4 space-y-2">
              {metrics.topFeatures.map((item, index) => (
                <div
                  key={item.feature}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                >
                  <p className="text-sm text-gray-200">
                    {index + 1}. {item.feature}
                  </p>
                  <p className="text-sm font-semibold text-white">
                    {item.users}
                  </p>
                </div>
              ))}
            </div>
          </GlassCard>
        </section>
      </div>
    </main>
  );
}
