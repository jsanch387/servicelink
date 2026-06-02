import { GlassCard } from '@/components/shared';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import {
  reviewSuccessBody,
  reviewSuccessHeadline,
  reviewSuccessSignOff,
} from '../copy/publicReviewCopy';

export function PublicReviewSuccessCard({
  businessName,
  customerGreetingName = '',
}: {
  businessName: string;
  customerGreetingName?: string;
}) {
  const signOff = reviewSuccessSignOff(businessName);

  return (
    <GlassCard padding="lg" rounded="rounded-2xl" className="w-full">
      <div className="flex w-full flex-col items-start gap-3 text-left">
        <CheckCircleIcon
          className="h-9 w-9 shrink-0 text-emerald-400"
          aria-hidden
        />

        <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
          {reviewSuccessHeadline(customerGreetingName)}
        </h2>

        <p className="text-sm leading-relaxed text-gray-400 sm:text-[0.9375rem]">
          {reviewSuccessBody(businessName)}
        </p>

        {signOff ? (
          <p className="pt-2 text-sm font-medium text-gray-300">{signOff}</p>
        ) : null}
      </div>
    </GlassCard>
  );
}
