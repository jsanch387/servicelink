import { usePublicBookingPolicyAgreement } from '@/features/availability/booking/hooks/usePublicBookingPolicyAgreement';
import { clearPublicBookingPolicyAgreementMemory } from '@/features/availability/booking/utils/bookingPolicyAgreementMemory';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(() => {
  cleanup();
  clearPublicBookingPolicyAgreementMemory();
  sessionStorage.clear();
});

describe('usePublicBookingPolicyAgreement', () => {
  it('does not persist agreement in sessionStorage', () => {
    const { result } = renderHook(() =>
      usePublicBookingPolicyAgreement({
        businessSlug: 'acme-detail',
        policyText: 'Be on time',
      })
    );

    expect(result.current.modalOpen).toBe(false);

    act(() => {
      result.current.runAfterAgreement(() => undefined);
    });
    expect(result.current.modalOpen).toBe(true);

    act(() => {
      result.current.agree();
    });

    expect(result.current.hasAgreed).toBe(true);
    expect(sessionStorage.length).toBe(0);
  });

  it('does not reopen on the next screen after they already agreed this load', () => {
    const first = renderHook(() =>
      usePublicBookingPolicyAgreement({
        businessSlug: 'acme-detail',
        policyText: 'Be on time',
      })
    );

    act(() => {
      first.result.current.runAfterAgreement(() => undefined);
    });
    act(() => {
      first.result.current.agree();
    });

    const calendar = renderHook(() =>
      usePublicBookingPolicyAgreement({
        businessSlug: 'acme-detail',
        policyText: 'Be on time',
        gateOnMount: true,
      })
    );

    expect(calendar.result.current.hasAgreed).toBe(true);
    expect(calendar.result.current.modalOpen).toBe(false);
  });
});
