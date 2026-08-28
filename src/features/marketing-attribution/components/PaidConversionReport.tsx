import { DashboardGlassCard } from '@/features/dashboard/components/DashboardGlassCard';
import type {
  PaidConversionCounts,
  PaidConversionPeriod,
  PaidConversionReport as PaidConversionReportData,
} from '../types';

const PERIODS: { id: PaidConversionPeriod; label: string }[] = [
  { id: '30d', label: 'Last 30 days' },
  { id: '90d', label: 'Last 90 days' },
  { id: 'all', label: 'All time' },
];

function percent(rate: number): string {
  return `${Math.round(rate * 1000) / 10}%`;
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <DashboardGlassCard fillGridCell={false}>
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
    </DashboardGlassCard>
  );
}

function CountsCells({ counts }: { counts: PaidConversionCounts }) {
  return (
    <>
      <td className="px-3 py-2 text-right tabular-nums text-zinc-200">
        {counts.signups}
      </td>
      <td className="px-3 py-2 text-right tabular-nums text-zinc-200">
        {counts.everPaid}
      </td>
      <td className="px-3 py-2 text-right tabular-nums text-zinc-200">
        {counts.currentlyPaying}
      </td>
      <td className="px-3 py-2 text-right tabular-nums text-zinc-200">
        {percent(counts.conversionRate)}
      </td>
    </>
  );
}

export function PaidConversionReport({
  report,
  pathname,
}: {
  report: PaidConversionReportData;
  pathname: string;
}) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Ad to paid conversion
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-400">
            First-touch signup source joined to Stripe Pro. Ever paid is the
            first time they became an active subscriber. Still paying is live
            Pro access with a Stripe subscription.
          </p>
        </div>
        <nav className="flex flex-wrap gap-2" aria-label="Signup period">
          {PERIODS.map(period => {
            const active = report.period === period.id;
            const href = `${pathname}?period=${period.id}`;
            return (
              <a
                key={period.id}
                href={href}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm ${
                  active
                    ? 'bg-white text-zinc-900'
                    : 'bg-white/5 text-zinc-300 hover:bg-white/10'
                }`}
              >
                {period.label}
              </a>
            );
          })}
        </nav>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Paid-ad signups"
          value={String(report.paidAds.signups)}
        />
        <StatCard
          label="Ever paid from ads"
          value={String(report.paidAds.everPaid)}
          hint={`${percent(report.paidAds.conversionRate)} of ad signups`}
        />
        <StatCard
          label="Still paying from ads"
          value={String(report.paidAds.currentlyPaying)}
        />
        <StatCard
          label="All signups"
          value={String(report.totals.signups)}
          hint={`${report.totals.everPaid} ever paid · ${report.totals.currentlyPaying} still paying`}
        />
      </section>

      <DashboardGlassCard fillGridCell={false} padding="none">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <caption className="sr-only">
              Signups and paid conversion by channel
            </caption>
            <thead>
              <tr className="border-b border-white/10 text-left text-zinc-400">
                <th className="px-4 py-3 font-medium">Channel</th>
                <th className="px-3 py-3 text-right font-medium">Signups</th>
                <th className="px-3 py-3 text-right font-medium">Ever paid</th>
                <th className="px-3 py-3 text-right font-medium">
                  Still paying
                </th>
                <th className="px-3 py-3 text-right font-medium">Conv.</th>
              </tr>
            </thead>
            <tbody>
              {report.byChannel.map(row => (
                <tr
                  key={row.channel}
                  className="border-b border-white/5 last:border-0"
                >
                  <td className="px-4 py-2 font-medium text-white">
                    {row.channel}
                  </td>
                  <CountsCells counts={row} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardGlassCard>

      <DashboardGlassCard fillGridCell={false} padding="none">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <caption className="sr-only">
              Signups and paid conversion by campaign
            </caption>
            <thead>
              <tr className="border-b border-white/10 text-left text-zinc-400">
                <th className="px-4 py-3 font-medium">Campaign</th>
                <th className="px-3 py-3 font-medium">Channel</th>
                <th className="px-3 py-3 font-medium">Source / medium</th>
                <th className="px-3 py-3 text-right font-medium">Signups</th>
                <th className="px-3 py-3 text-right font-medium">Ever paid</th>
                <th className="px-3 py-3 text-right font-medium">
                  Still paying
                </th>
                <th className="px-3 py-3 text-right font-medium">Conv.</th>
              </tr>
            </thead>
            <tbody>
              {report.byCampaign.map(row => (
                <tr
                  key={`${row.channel}-${row.source}-${row.medium}-${row.campaign}`}
                  className="border-b border-white/5 last:border-0"
                >
                  <td className="px-4 py-2 font-medium text-white">
                    {row.campaign}
                  </td>
                  <td className="px-3 py-2 text-zinc-300">{row.channel}</td>
                  <td className="px-3 py-2 text-zinc-400">
                    {row.source} / {row.medium}
                  </td>
                  <CountsCells counts={row} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardGlassCard>
    </div>
  );
}
