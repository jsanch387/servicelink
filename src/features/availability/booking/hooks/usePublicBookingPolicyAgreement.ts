'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  hasAgreedToPublicBookingPolicy,
  markPublicBookingPolicyAgreed,
} from '../utils/bookingPolicyAgreementStorage';

export function usePublicBookingPolicyAgreement(args: {
  businessSlug: string;
  policyText?: string | null;
  skip?: boolean;
  /** Open the modal as soon as we know they have not agreed this visit. */
  gateOnMount?: boolean;
}) {
  const policyText = args.policyText?.trim() ?? '';
  const required = args.skip !== true && policyText.length > 0;
  const [hasAgreed, setHasAgreed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!required) {
      setHasAgreed(true);
      setModalOpen(false);
      return;
    }
    const already = hasAgreedToPublicBookingPolicy(args.businessSlug);
    setHasAgreed(already);
    if (args.gateOnMount && !already) {
      setModalOpen(true);
    }
  }, [args.businessSlug, args.gateOnMount, required]);

  const runAfterAgreement = useCallback(
    (action: () => void) => {
      if (!required || hasAgreedToPublicBookingPolicy(args.businessSlug)) {
        action();
        return;
      }
      pendingActionRef.current = action;
      setModalOpen(true);
    },
    [args.businessSlug, required]
  );

  const agree = useCallback(() => {
    markPublicBookingPolicyAgreed(args.businessSlug);
    setHasAgreed(true);
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    // Keep the modal up and flip to the destination loader immediately.
    // Closing first flashes the previous screen while router.push loads.
    if (action) {
      setIsAdvancing(true);
      action();
      return;
    }
    setModalOpen(false);
  }, [args.businessSlug]);

  const dismiss = useCallback(() => {
    pendingActionRef.current = null;
    setModalOpen(false);
  }, []);

  return {
    required,
    policyText,
    hasAgreed,
    isAdvancing,
    modalOpen,
    runAfterAgreement,
    agree,
    dismiss,
  };
}
