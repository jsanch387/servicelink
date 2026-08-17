'use client';

import React from 'react';

interface PublicMembershipStepHeadingProps {
  id: string;
  title: string;
  hint?: string | null;
  className?: string;
}

/** Title + hint as one tight group above step content. */
export const PublicMembershipStepHeading: React.FC<
  PublicMembershipStepHeadingProps
> = ({ id, title, hint, className = '' }) => {
  const hintText = hint?.trim() ?? '';

  return (
    <header className={className || undefined}>
      <h1
        id={id}
        className="text-2xl font-black tracking-tight text-white sm:text-[1.75rem]"
      >
        {title}
      </h1>
      {hintText ? (
        <p className="mt-0.5 text-sm leading-snug text-zinc-400">{hintText}</p>
      ) : null}
    </header>
  );
};
