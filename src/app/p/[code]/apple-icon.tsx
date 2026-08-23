import { renderPaymentLinkShareIcon } from '@/features/payments/walk-up/renderPaymentLinkShareIcon';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function PaymentLinkAppleIcon() {
  return renderPaymentLinkShareIcon(size.width);
}
