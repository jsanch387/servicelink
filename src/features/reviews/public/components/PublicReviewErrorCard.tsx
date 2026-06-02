import { GlassCard } from '@/components/shared';
import type { PublicReviewInviteErrorReason } from '../utils/inviteErrorCopy';
import { publicReviewInviteErrorCopy } from '../utils/inviteErrorCopy';

export function PublicReviewErrorCard({
  reason,
}: {
  reason: PublicReviewInviteErrorReason;
}) {
  const { title, detail } = publicReviewInviteErrorCopy(reason);

  return (
    <GlassCard
      padding="lg"
      rounded="rounded-2xl"
      blurColor="bg-zinc-500"
      showBlur
      className="w-full"
    >
      <div className="mx-auto max-w-sm text-center">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-400">{detail}</p>
      </div>
    </GlassCard>
  );
}
