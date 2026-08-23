import { renderPaymentLinkShareIcon } from '@/features/payments/walk-up/renderPaymentLinkShareIcon';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function PaymentLinkIcon() {
  return renderPaymentLinkShareIcon(size.width);
}
