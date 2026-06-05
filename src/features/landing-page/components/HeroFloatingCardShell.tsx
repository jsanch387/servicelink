import { LinkIcon } from '@heroicons/react/24/outline';
import React from 'react';

const iconBoxToneClass = {
  emerald: 'border-emerald-500/40 bg-emerald-950',
  neutral: 'border-neutral-600 bg-neutral-800',
} as const;

type IconBoxTone = keyof typeof iconBoxToneClass;

function LiveDot({ tone = 'emerald' }: { tone?: 'emerald' | 'neutral' }) {
  const colorClass = tone === 'emerald' ? 'bg-emerald-400' : 'bg-gray-300';

  return (
    <span
      className={`inline-flex h-1.5 w-1.5 shrink-0 rounded-full ${colorClass}`}
      aria-hidden
    />
  );
}

export function HeroFloatingIconBox({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: IconBoxTone;
}) {
  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ${iconBoxToneClass[tone]}`}
    >
      {children}
    </div>
  );
}

type HeroFloatingCardProps = {
  children: React.ReactNode;
  className?: string;
  halo?: 'emerald' | 'white' | 'none';
};

export function HeroFloatingCard({
  children,
  className = '',
  halo = 'none',
}: HeroFloatingCardProps) {
  const haloClass =
    halo === 'emerald'
      ? 'bg-emerald-500/25'
      : halo === 'white'
        ? 'bg-white/10'
        : '';

  return (
    <div className={`relative ${className}`.trim()}>
      {halo !== 'none' ? (
        <div
          aria-hidden
          className={`absolute -inset-2 -z-10 rounded-3xl blur-xl ${haloClass}`}
        />
      ) : null}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.12] bg-[#161616] px-3 py-2.5 shadow-[0_0_0_1px_rgba(255,255,255,0.07),0_20px_50px_rgba(0,0,0,0.55),0_0_20px_rgba(255,255,255,0.04)] before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent">
        {children}
      </div>
    </div>
  );
}

type HeroNotificationCardProps = {
  icon: React.ReactNode;
  label: string;
  title: React.ReactNode;
  iconTone?: IconBoxTone;
  live?: boolean;
};

export function HeroNotificationCard({
  icon,
  label,
  title,
  iconTone = 'neutral',
  live = false,
}: HeroNotificationCardProps) {
  return (
    <HeroFloatingCard halo={iconTone === 'emerald' ? 'emerald' : 'none'}>
      <div className="flex items-center gap-3">
        <HeroFloatingIconBox tone={iconTone}>{icon}</HeroFloatingIconBox>
        <div className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-1.5">
            {live ? (
              <LiveDot tone={iconTone === 'emerald' ? 'emerald' : 'neutral'} />
            ) : null}
            <p className="text-[11px] font-medium text-gray-400">{label}</p>
            {live ? (
              <span className="text-[10px] font-medium text-gray-500">
                · just now
              </span>
            ) : null}
          </div>
          <div className="mt-0.5 text-sm font-semibold leading-tight tracking-tight text-white">
            {title}
          </div>
        </div>
      </div>
    </HeroFloatingCard>
  );
}

type HeroBookingLinkCardProps = {
  label: string;
  domain: string;
  slug: string;
};

export function HeroBookingLinkCard({
  label,
  domain,
  slug,
}: HeroBookingLinkCardProps) {
  const fullLink = `${domain}/${slug}`;

  return (
    <HeroFloatingCard halo="white">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium text-gray-400">{label}</p>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-gray-400">
          <LiveDot tone="emerald" />
          Live
        </span>
      </div>
      <div className="mt-1.5 flex min-w-0 items-center gap-2 rounded-[10px] border border-neutral-600 bg-neutral-800 px-2.5 py-2">
        <LinkIcon className="h-4 w-4 shrink-0 text-white" aria-hidden />
        <p
          className="min-w-0 font-mono text-[11px] leading-snug whitespace-normal break-all sm:text-xs"
          title={fullLink}
        >
          <span className="text-gray-500">{domain}/</span>
          <span className="font-medium text-white">{slug}</span>
        </p>
      </div>
    </HeroFloatingCard>
  );
}
