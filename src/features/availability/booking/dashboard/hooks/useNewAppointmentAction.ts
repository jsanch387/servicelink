import { useEffect, useState } from 'react';
import {
  getNewAppointmentActionState,
  type NewAppointmentActionState,
} from '../utils/newAppointmentAction';

const NOTICE_DISMISS_MS = 4500;

export function useNewAppointmentAction(args: {
  hasPublicPageSlug: boolean;
  atFreeBookingCap: boolean;
}): NewAppointmentActionState & {
  notice: string | null;
  onBlockedClick: () => void;
} {
  const action = getNewAppointmentActionState(args);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), NOTICE_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  return {
    ...action,
    notice,
    onBlockedClick: () => {
      if (action.blockedNotice) setNotice(action.blockedNotice);
    },
  };
}
