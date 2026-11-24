'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  emptyPreviewSession,
  PREVIEW_DISMISS_GUIDE_EVENT,
  readPreviewSession,
  seedPreviewForStep,
  writePreviewSession,
  type OnboardingPreviewSession,
  type PreviewStep,
} from './session';

export function useOnboardingPreview() {
  const [session, setSession] =
    useState<OnboardingPreviewSession>(emptyPreviewSession);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSession(readPreviewSession());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writePreviewSession(session);
  }, [hydrated, session]);

  const patch = useCallback((partial: Partial<OnboardingPreviewSession>) => {
    setSession(current => ({ ...current, ...partial }));
  }, []);

  const enter = useCallback(() => {
    setSession(current => ({
      ...emptyPreviewSession(),
      surface: current.surface,
      open: true,
    }));
  }, []);

  const startOver = useCallback(() => {
    setSession(current => ({
      ...emptyPreviewSession(),
      surface: current.surface,
      open: true,
    }));
  }, []);

  const exit = useCallback(() => {
    patch({ open: false });
  }, [patch]);

  const finish = useCallback((bookedTest: boolean, calendarGuide = false) => {
    setSession(current => ({
      ...current,
      open: false,
      finished: true,
      bookedTest,
      calendarGuide,
      checklistDismissed: false,
    }));
  }, []);

  const dismissCalendarGuide = useCallback(() => {
    patch({ calendarGuide: false });
  }, [patch]);

  useEffect(() => {
    const onDismiss = () => dismissCalendarGuide();
    window.addEventListener(PREVIEW_DISMISS_GUIDE_EVENT, onDismiss);
    return () =>
      window.removeEventListener(PREVIEW_DISMISS_GUIDE_EVENT, onDismiss);
  }, [dismissCalendarGuide]);

  const dismissChecklist = useCallback(() => {
    patch({ checklistDismissed: true });
  }, [patch]);

  const openAt = useCallback((step: PreviewStep) => {
    setSession(current => seedPreviewForStep({ ...current, open: true }, step));
  }, []);

  return {
    session,
    patch,
    enter,
    startOver,
    exit,
    finish,
    dismissCalendarGuide,
    dismissChecklist,
    openAt,
    showChecklist:
      session.finished && !session.open && !session.checklistDismissed,
  };
}
