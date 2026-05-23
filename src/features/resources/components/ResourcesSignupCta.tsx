import { Button } from '@/components/shared';
import { ROUTES } from '@/constants/routes';

export function ResourcesSignupCta() {
  return (
    <section
      className="mb-12 sm:mb-16 relative overflow-hidden rounded-2xl sm:rounded-3xl"
      aria-labelledby="resources-cta-heading"
    >
      <div
        className="absolute inset-0 rounded-2xl sm:rounded-3xl p-px bg-gradient-to-br from-white/40 via-white/10 to-white/5"
        aria-hidden
      >
        <div className="h-full w-full rounded-[calc(1rem-1px)] sm:rounded-[calc(1.5rem-1px)] bg-[var(--dashboard-bg)]" />
      </div>
      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center p-6 sm:p-10 md:p-12">
        <div>
          <p className="text-sm font-medium text-white/50 mb-3">ServiceLink</p>
          <h2
            id="resources-cta-heading"
            className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight mb-3"
          >
            Turn readers into booked jobs
          </h2>
          <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
            One link for services, quotes, deposits, and scheduling—built for
            mobile detailers and local service pros.
          </p>
        </div>
        <div className="flex flex-col items-start md:items-end gap-3">
          <Button
            href={ROUTES.AUTH.SIGNUP}
            variant="inverse"
            size="lg"
            className="w-full md:w-auto min-w-[220px] font-bold"
          >
            Create your ServiceLink
          </Button>
          <p className="text-xs text-gray-500 md:text-right">
            Free to start · No credit card required
          </p>
        </div>
      </div>
    </section>
  );
}
