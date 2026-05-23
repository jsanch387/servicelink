import { WORKSHOP_PLAYBOOK_STEPS } from '../data/workshopWatchContent';
import { AdsWorkshopBookingLinkMock } from './AdsWorkshopBookingLinkMock';

export function AdsWorkshopPlaybookBridge() {
  return (
    <section aria-labelledby="workshop-playbook-heading" className="space-y-5">
      <header className="text-center sm:text-left">
        <h2
          id="workshop-playbook-heading"
          className="text-lg sm:text-xl font-bold text-white text-balance"
        >
          Your 3-step playbook after the video
        </h2>
        <p className="mt-2 text-sm text-gray-400 leading-relaxed text-pretty">
          This is how detailers turn the masterclass into booked jobs — without
          living in the DMs.
        </p>
      </header>

      <div className="grid gap-3 sm:gap-4">
        {WORKSHOP_PLAYBOOK_STEPS.map(step => (
          <article
            key={step.id}
            className="flex gap-3 sm:gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4"
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-neutral-900"
              aria-hidden
            >
              {step.step}
            </span>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-white">
                {step.title}
              </h3>
              <p className="mt-1 text-sm text-gray-400 leading-relaxed">
                {step.description}
              </p>
            </div>
          </article>
        ))}
      </div>

      <AdsWorkshopBookingLinkMock />
    </section>
  );
}
