'use client';

import type { PreviewStep, PreviewSurface } from '../session';

const JUMPS: { id: PreviewStep; label: string }[] = [
  { id: 'industry', label: 'Step 1' },
  { id: 'business', label: 'Step 2' },
  { id: 'live', label: 'Live' },
  { id: 'recap', label: 'After booking' },
];

interface PreviewChromeProps {
  step: PreviewStep;
  surface: PreviewSurface;
  onJump: (step: PreviewStep) => void;
  onSurface: (surface: PreviewSurface) => void;
  onStartOver: () => void;
  onExit: () => void;
}

export function PreviewChrome({
  step,
  surface,
  onJump,
  onSurface,
  onStartOver,
  onExit,
}: PreviewChromeProps) {
  return (
    <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-white/[0.08] bg-[#141414] px-4 py-2">
      <p className="shrink-0 text-xs font-medium text-white/50">
        Design preview
      </p>
      <div className="flex shrink-0 items-center gap-1">
        {JUMPS.map(item => {
          const selected = item.id === step;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onJump(item.id)}
              className={`cursor-pointer rounded-full px-2.5 py-1 text-xs font-medium ${
                selected
                  ? 'bg-white text-black'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
              aria-pressed={selected}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="mx-1 h-4 w-px shrink-0 bg-white/10" aria-hidden />
      <div className="flex shrink-0 items-center gap-1">
        {(
          [
            ['web', 'Web'],
            ['app', 'In the app'],
          ] as const
        ).map(([id, label]) => {
          const selected = surface === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSurface(id)}
              className={`cursor-pointer rounded-full px-2.5 py-1 text-xs font-medium ${
                selected
                  ? 'bg-white text-black'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
              aria-pressed={selected}
            >
              {label}
            </button>
          );
        })}
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onStartOver}
          className="cursor-pointer rounded-full px-2.5 py-1 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white"
        >
          Start over
        </button>
        <button
          type="button"
          onClick={onExit}
          className="cursor-pointer rounded-full px-2.5 py-1 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white"
        >
          Exit
        </button>
      </div>
    </div>
  );
}
