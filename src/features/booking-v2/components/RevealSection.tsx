'use client';

import React, { useEffect, useState } from 'react';

/** Short rise-in used when the next setup section appears. */
export function RevealSection({
  delayMs = 0,
  children,
}: {
  delayMs?: number;
  children: React.ReactNode;
}) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setShown(true), delayMs);
    return () => window.clearTimeout(id);
  }, [delayMs]);

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        shown ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      }`}
    >
      {children}
    </div>
  );
}
