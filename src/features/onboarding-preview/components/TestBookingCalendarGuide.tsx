'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { PREVIEW_DISMISS_GUIDE_EVENT } from '../session';

interface AnchorBox {
  top: number;
  left: number;
  width: number;
  height: number;
}

function visibleBookingsAnchor(): AnchorBox | null {
  const nodes = document.querySelectorAll('[data-onboarding-guide="bookings"]');
  for (const node of nodes) {
    const rect = node.getBoundingClientRect();
    const visible =
      rect.width > 0 &&
      rect.height > 0 &&
      rect.right > 8 &&
      rect.left < window.innerWidth - 8;
    if (!visible) continue;
    return {
      top: rect.top,
      left: rect.right + 12,
      width: rect.width,
      height: rect.height,
    };
  }
  return null;
}

export function TestBookingCalendarGuide() {
  const [anchor, setAnchor] = useState<AnchorBox | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const place = () => setAnchor(visibleBookingsAnchor());
    place();
    const observer = new MutationObserver(place);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    const reveal = window.setTimeout(() => setReady(true), 350);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
      window.clearTimeout(reveal);
    };
  }, []);

  const dismiss = () => {
    window.dispatchEvent(new Event(PREVIEW_DISMISS_GUIDE_EVENT));
  };

  const copy = (
    <p className="text-sm text-white">
      Your test appointment is on the calendar. Open it and mark it complete.
    </p>
  );

  if (anchor) {
    return createPortal(
      <div
        className="fixed z-[70] w-64 rounded-[10px] border border-white/[0.08] bg-[#1c1c1c] p-3 shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
        style={{ top: anchor.top, left: anchor.left }}
      >
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">{copy}</div>
          <button
            type="button"
            onClick={dismiss}
            className="cursor-pointer text-white/50 hover:text-white"
            aria-label="Dismiss"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>,
      document.body
    );
  }

  if (!ready) return null;

  return (
    <section className="mb-5 rounded-[10px] border border-white/[0.08] bg-white/[0.03] p-4 lg:hidden">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">{copy}</div>
        <button
          type="button"
          onClick={dismiss}
          className="cursor-pointer text-white/50 hover:text-white"
          aria-label="Dismiss"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}
