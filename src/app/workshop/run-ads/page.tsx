import { ROUTES } from '@/constants/routes';
import { redirect } from 'next/navigation';

/** Legacy URL → current workshop gate. */
export default function RunAdsWorkshopRedirectPage() {
  redirect(ROUTES.WORKSHOP);
}
