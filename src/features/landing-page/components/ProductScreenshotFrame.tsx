import Image from 'next/image';
import React from 'react';
import type {
  LandingShowcaseFrame,
  LandingShowcaseMock,
} from '../data/landingProductShowcases';

interface ProductScreenshotFrameProps {
  frame: LandingShowcaseFrame;
  image: string | null;
  imageAlt: string;
  mock: LandingShowcaseMock;
  placeholderLabel: string;
}

export function ProductScreenshotFrame({
  frame,
  image,
  imageAlt,
  mock,
  placeholderLabel,
}: ProductScreenshotFrameProps) {
  const chrome =
    frame === 'phone'
      ? 'rounded-[28px] border border-white/10 bg-[#141416] p-2 shadow-[0_24px_80px_rgba(0,0,0,0.45)]'
      : 'rounded-2xl border border-white/10 bg-[#141416] p-2 shadow-[0_24px_80px_rgba(0,0,0,0.4)]';

  return (
    <div className={`relative mx-auto w-full ${chrome}`}>
      {frame === 'browser' ? <BrowserChrome /> : <PhoneNotch />}
      <div
        className={`relative overflow-hidden bg-[#0c0c0e] ${
          frame === 'phone'
            ? 'aspect-[9/19] rounded-[22px]'
            : 'aspect-[16/10] rounded-xl'
        }`}
      >
        {image ? (
          <Image
            src={image}
            alt={imageAlt}
            fill
            className="object-cover object-top"
            sizes={
              frame === 'phone'
                ? '(max-width: 640px) 280px, 320px'
                : '(max-width: 768px) 100vw, 640px'
            }
          />
        ) : mock === 'sms' ? (
          <SmsThreadMock />
        ) : mock === 'dashboard' ? (
          <DashboardMock />
        ) : (
          <ScreenshotPlaceholder label={placeholderLabel} />
        )}
      </div>
    </div>
  );
}

function BrowserChrome() {
  return (
    <div className="mb-2 flex items-center gap-1.5 px-2 pt-1" aria-hidden>
      <span className="h-2 w-2 rounded-full bg-white/20" />
      <span className="h-2 w-2 rounded-full bg-white/15" />
      <span className="h-2 w-2 rounded-full bg-white/10" />
      <span className="ml-2 h-5 flex-1 rounded-md bg-white/[0.04]" />
    </div>
  );
}

function PhoneNotch() {
  return (
    <div className="mb-1.5 flex justify-center" aria-hidden>
      <span className="h-1.5 w-16 rounded-full bg-white/10" />
    </div>
  );
}

function ScreenshotPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-center">
      <span className="rounded-full border border-dashed border-white/15 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
        Screenshot
      </span>
      <p className="text-sm font-medium text-zinc-400">{label}</p>
    </div>
  );
}

function SmsThreadMock() {
  return (
    <div className="flex h-full flex-col bg-[#0c0c0e] px-3.5 pt-8">
      <p className="mb-4 text-center text-[11px] font-medium text-zinc-500">
        ServiceLink
      </p>
      <div className="space-y-2.5">
        <SmsBubble incoming>
          You’re booked — Thu 9:00 AM. We’ll text when we’re on the way.
        </SmsBubble>
        <SmsBubble incoming>On the way. ETA 12 min.</SmsBubble>
        <SmsBubble incoming>All done. Thanks for booking.</SmsBubble>
      </div>
    </div>
  );
}

function SmsBubble({
  children,
  incoming,
}: {
  children: React.ReactNode;
  incoming?: boolean;
}) {
  return (
    <p
      className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-snug ${
        incoming
          ? 'bg-white/[0.08] text-zinc-100'
          : 'ml-auto bg-white text-black'
      }`}
    >
      {children}
    </p>
  );
}

function DashboardMock() {
  return (
    <div className="flex h-full flex-col bg-[#0c0c0e] p-4 sm:p-5">
      <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
        Today
      </p>
      <p className="mt-1 text-lg font-semibold text-white">4 jobs · $860</p>
      <div className="mt-4 space-y-2">
        {[
          ['9:00', 'Full interior', 'Sarah M.'],
          ['11:30', 'Ceramic boost', 'James R.'],
          ['2:00', 'SUV detail', 'Mike A.'],
        ].map(([time, job, name]) => (
          <div
            key={time}
            className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5"
          >
            <div>
              <p className="text-sm font-medium text-white">{job}</p>
              <p className="text-xs text-zinc-500">{name}</p>
            </div>
            <p className="text-xs tabular-nums text-zinc-400">{time}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
