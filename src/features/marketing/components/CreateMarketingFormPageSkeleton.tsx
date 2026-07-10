import React from 'react';

const pulse = 'animate-pulse rounded-lg bg-white/10';

function HeaderSkeleton({ actionWidth = 'w-24' }: { actionWidth?: string }) {
  return (
    <div className="sticky top-0 z-10 bg-[var(--dashboard-bg)]">
      <div className="flex w-full items-center justify-between px-4 pt-6 pb-3 sm:px-6 sm:pt-8 lg:px-8">
        <div className="flex items-center gap-1.5">
          <div className={`h-[18px] w-[18px] shrink-0 ${pulse}`} />
          <div className={`h-4 w-16 ${pulse}`} />
        </div>
        <div className={`h-8 ${actionWidth} rounded-[10px] ${pulse}`} />
      </div>
    </div>
  );
}

function TitleSkeleton() {
  return (
    <div className="mb-8 space-y-2">
      <div className={`h-8 w-44 max-w-full ${pulse}`} />
      <div className={`h-4 w-full max-w-md ${pulse}`} />
      <div className={`h-4 w-3/4 max-w-sm ${pulse}`} />
    </div>
  );
}

function FieldSkeleton({ labelWidth = 'w-24' }: { labelWidth?: string }) {
  return (
    <div className="space-y-2">
      <div className={`h-4 ${labelWidth} ${pulse}`} />
      <div className={`h-10 w-full ${pulse}`} />
    </div>
  );
}

function SwitchRowSkeleton() {
  return (
    <div className="border-t border-white/[0.06] pt-4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className={`h-4 w-16 ${pulse}`} />
          <div className={`h-3 w-full max-w-xs ${pulse}`} />
        </div>
        <div className={`h-6 w-11 shrink-0 rounded-full ${pulse}`} />
      </div>
    </div>
  );
}

function FormCardSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mb-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-6"
      aria-hidden
    >
      <div className="space-y-5">{children}</div>
    </div>
  );
}

function MoreOptionsSkeleton() {
  return (
    <div
      className={`mb-4 flex h-12 w-full items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 ${pulse}`}
      aria-hidden
    >
      <span className="sr-only">More options</span>
    </div>
  );
}

function DesktopSubmitSkeleton() {
  return <div className={`hidden h-11 w-full sm:block ${pulse}`} aria-hidden />;
}

function MobileSubmitSkeleton() {
  return (
    <div className="fixed inset-x-0 bottom-0 border-t border-white/10 bg-[var(--dashboard-bg)]/95 p-4 backdrop-blur-sm sm:hidden">
      <div className={`h-11 w-full ${pulse}`} aria-hidden />
    </div>
  );
}

function CreateFormPageShell({
  actionWidth,
  children,
}: {
  actionWidth: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-screen flex-col bg-[var(--dashboard-bg)]"
      aria-busy="true"
      aria-label="Loading form"
    >
      <HeaderSkeleton actionWidth={actionWidth} />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-lg px-4 pb-24 pt-2 sm:max-w-2xl sm:px-6 sm:pb-12 sm:pt-4 lg:max-w-3xl">
          {children}
        </div>
      </div>
      <MobileSubmitSkeleton />
    </div>
  );
}

export const CreatePromoCodePageSkeleton: React.FC = () => {
  return (
    <CreateFormPageShell actionWidth="w-24">
      <TitleSkeleton />
      <FormCardSkeleton>
        <FieldSkeleton labelWidth="w-20" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldSkeleton labelWidth="w-28" />
          <FieldSkeleton labelWidth="w-16" />
        </div>
        <SwitchRowSkeleton />
      </FormCardSkeleton>
      <MoreOptionsSkeleton />
      <DesktopSubmitSkeleton />
    </CreateFormPageShell>
  );
};

export const CreateSalePageSkeleton: React.FC = () => {
  return (
    <CreateFormPageShell actionWidth="w-24">
      <TitleSkeleton />
      <FormCardSkeleton>
        <FieldSkeleton labelWidth="w-20" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldSkeleton labelWidth="w-28" />
          <FieldSkeleton labelWidth="w-16" />
        </div>
        <SwitchRowSkeleton />
      </FormCardSkeleton>
      <MoreOptionsSkeleton />
      <DesktopSubmitSkeleton />
    </CreateFormPageShell>
  );
};
