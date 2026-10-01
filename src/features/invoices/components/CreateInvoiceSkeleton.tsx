import React from 'react';

const pulse = 'animate-pulse rounded-lg bg-white/10';
const paperPulse = 'animate-pulse rounded bg-[#eceae4]';

const cardClassName =
  'rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 sm:p-5';

export const CreateInvoiceSkeleton: React.FC = () => {
  return (
    <main className="flex min-h-screen w-full flex-1 flex-col overflow-x-hidden bg-[var(--dashboard-bg)]">
      <div
        role="status"
        aria-label="Loading new invoice"
        className="mx-auto w-full min-w-0 max-w-[1600px] flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-10"
      >
        <span className="sr-only">Loading new invoice</span>

        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className={`h-4 w-24 ${pulse}`} aria-hidden />
          <div className="flex items-center gap-2" aria-hidden>
            <div className={`h-10 w-32 rounded-[10px] ${pulse}`} />
            <div className={`h-10 w-32 rounded-[10px] ${pulse}`} />
          </div>
        </header>

        <div className="grid items-stretch gap-5 lg:grid-cols-2 lg:gap-8">
          <div className="flex min-w-0 flex-col gap-4" aria-hidden>
            <section className={cardClassName}>
              <div className="border-b border-white/10 pb-3">
                <div className={`h-4 w-32 ${pulse}`} />
              </div>
              <div className="mt-4 space-y-3">
                <div className={`h-3 w-16 ${pulse}`} />
                <div className={`h-11 w-full rounded-lg ${pulse}`} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <div className={`h-3 w-12 ${pulse}`} />
                    <div className={`h-11 w-full rounded-lg ${pulse}`} />
                  </div>
                  <div className="space-y-2">
                    <div className={`h-3 w-12 ${pulse}`} />
                    <div className={`h-11 w-full rounded-lg ${pulse}`} />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <div className={`h-3 w-16 ${pulse}`} />
                    <div className={`h-11 w-full rounded-lg ${pulse}`} />
                  </div>
                </div>
              </div>
            </section>

            <section className={cardClassName}>
              <div className="border-b border-white/10 pb-3">
                <div className={`h-4 w-20 ${pulse}`} />
              </div>
              <div className="mt-4 hidden grid-cols-[minmax(0,1fr)_4.5rem_7.5rem_2.25rem] gap-2 sm:grid">
                <div className={`h-3 w-10 ${pulse}`} />
                <div className={`h-3 w-8 ${pulse}`} />
                <div className={`h-3 w-10 ${pulse}`} />
              </div>
              <div className="mt-3 grid grid-cols-1 items-end gap-3 border-b border-white/[0.06] py-3 sm:grid-cols-[minmax(0,1fr)_4.5rem_7.5rem_2.25rem]">
                <div className={`h-11 w-full rounded-lg ${pulse}`} />
                <div className={`h-11 w-full rounded-lg ${pulse}`} />
                <div className={`h-11 w-full rounded-lg ${pulse}`} />
                <div
                  className={`h-8 w-8 justify-self-end rounded-lg ${pulse}`}
                />
              </div>
              <div className={`mt-4 h-4 w-20 ${pulse}`} />
              <div className="mt-5 space-y-2">
                <div className={`h-3 w-12 ${pulse}`} />
                <div className={`h-20 w-full rounded-lg ${pulse}`} />
              </div>
            </section>
          </div>

          <div className="min-w-0 lg:h-full" aria-hidden>
            <section className="flex h-full flex-col rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 sm:p-5">
              <div className={`mb-4 h-5 w-20 ${pulse}`} />
              <article className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-[0_12px_32px_rgba(0,0,0,0.28)]">
                <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
                  <div className={`h-4 w-36 ${paperPulse}`} />
                  <div className={`h-3.5 w-12 ${paperPulse}`} />
                </div>
                <div className="mx-6 border-t border-[#eceae4]" />
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 px-6 py-4">
                  <div className="space-y-2">
                    <div className={`h-2.5 w-14 ${paperPulse}`} />
                    <div className={`h-3.5 w-24 ${paperPulse}`} />
                  </div>
                  <div className="space-y-2">
                    <div className={`h-2.5 w-14 ${paperPulse}`} />
                    <div className={`h-3.5 w-10 ${paperPulse}`} />
                  </div>
                  <div className="space-y-2">
                    <div className={`h-2.5 w-16 ${paperPulse}`} />
                    <div className={`h-3.5 w-28 ${paperPulse}`} />
                  </div>
                </div>
                <div className="px-6 pb-6">
                  <div className="grid grid-cols-[minmax(0,1fr)_2.25rem_5.25rem_5.25rem] gap-x-3 rounded-md bg-[#f4f3f0] px-3 py-2">
                    <div className={`h-2.5 w-8 ${paperPulse}`} />
                    <div
                      className={`h-2.5 w-6 justify-self-end ${paperPulse}`}
                    />
                    <div
                      className={`h-2.5 w-12 justify-self-end ${paperPulse}`}
                    />
                    <div
                      className={`h-2.5 w-12 justify-self-end ${paperPulse}`}
                    />
                  </div>
                  <div className={`mx-3 mt-4 h-3.5 w-40 ${paperPulse}`} />
                  <div className="mt-6 ml-auto flex w-full max-w-[220px] flex-col gap-2 pr-3">
                    <div className="flex justify-between gap-6">
                      <div className={`h-3.5 w-16 ${paperPulse}`} />
                      <div className={`h-3.5 w-12 ${paperPulse}`} />
                    </div>
                    <div className="flex justify-between gap-6">
                      <div className={`h-3.5 w-20 ${paperPulse}`} />
                      <div className={`h-3.5 w-12 ${paperPulse}`} />
                    </div>
                  </div>
                </div>
              </article>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
};
