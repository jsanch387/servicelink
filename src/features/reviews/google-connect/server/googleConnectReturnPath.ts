import { ROUTES } from '@/constants/routes';

export type GoogleConnectReturnNotice = 'connected' | 'error';

export function googleConnectReturnPath(
  notice: GoogleConnectReturnNotice
): string {
  const params = new URLSearchParams({ google: notice });
  return `${ROUTES.DASHBOARD.REVIEWS}?${params.toString()}`;
}
