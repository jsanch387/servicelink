import { PAYMENT_LINK_SHARE_TITLE } from '@/features/payments/walk-up/constants';
import { renderPaymentLinkOpenGraphImage } from '@/features/payments/walk-up/renderPaymentLinkOpenGraphImage';

export const alt = PAYMENT_LINK_SHARE_TITLE;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function PaymentLinkOpenGraphImage() {
  return renderPaymentLinkOpenGraphImage();
}
