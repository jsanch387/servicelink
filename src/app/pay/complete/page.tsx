import { ROUTES } from '@/constants/routes';
import { WalkUpPaymentCompletePage } from '@/features/payments/walk-up/WalkUpPaymentCompletePage';
import { PAYMENT_LINK_RESUME_COOKIE } from '@/features/payments/walk-up/paymentLinkResumeCookie';
import { isValidPaymentRequestShortCode } from '@/features/payments/walk-up/generatePaymentRequestShortCode';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

interface PayCompletePageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function PayCompletePage({
  searchParams,
}: PayCompletePageProps) {
  const { status } = await searchParams;
  const canceled = status === 'canceled' || status === 'cancel';
  if (canceled) {
    const resume = (await cookies()).get(PAYMENT_LINK_RESUME_COOKIE)?.value;
    const code = resume?.trim() ?? '';
    if (isValidPaymentRequestShortCode(code)) {
      redirect(ROUTES.PAY_LINK(code));
    }
  }
  return <WalkUpPaymentCompletePage canceled={canceled} />;
}
