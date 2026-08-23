import { SubscriptionSuccessCheckmark } from '@/features/subscriptions/components/SubscriptionSuccessCheckmark';
import { XCircleIcon } from '@heroicons/react/24/outline';
import '@/features/subscriptions/components/SubscriptionPlanReadySuccess.css';

export function WalkUpPaymentCompletePage({
  canceled,
}: {
  canceled: boolean;
}) {
  if (canceled) {
    return (
      <main className="flex min-h-[100dvh] w-full flex-col items-center justify-center bg-[var(--dashboard-bg)] px-4 py-10">
        <div className="mx-auto w-full max-w-md text-center">
          <div
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-rose-500/25 bg-rose-500/10"
            aria-hidden
          >
            <XCircleIcon className="h-7 w-7 text-rose-400" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-white">
            Payment not completed
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-zinc-400">
            This charge was not collected. You can close this page.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[100dvh] w-full flex-col overflow-x-hidden bg-[var(--dashboard-bg)] px-4">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center py-16 text-center">
        <div className="mb-3">
          <SubscriptionSuccessCheckmark />
        </div>
        <div className="subscription-plan-ready-content">
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Payment successful
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-zinc-400 sm:text-[0.9375rem]">
            You&apos;re all set. You can close this page.
          </p>
        </div>
      </div>
    </main>
  );
}
