import React from 'react';
import {
  MockCheck,
  MockPrimaryButton,
  MockRow,
  MockStatusBar,
  MockStepTracker,
} from './mockUi';
import {
  SAMPLE_DATES,
  SAMPLE_PACKAGES,
  SAMPLE_SHOP,
  SAMPLE_SIZES,
  SAMPLE_SLOTS,
} from './sampleShop';

const SCREEN = 'flex h-full flex-col bg-[#0F0F0F] pb-5 text-white';

export function BookingPackagesScreen({
  compact = true,
}: {
  compact?: boolean;
}) {
  return (
    <div className={SCREEN}>
      {compact ? <MockStatusBar /> : null}
      <div
        className={`flex min-h-0 flex-1 flex-col ${compact ? 'px-3.5' : 'px-6 pt-6'}`}
      >
        <MockStepTracker current={0} />
        <h2
          className={`font-bold tracking-tight text-white ${compact ? 'text-[15px]' : 'text-xl'}`}
        >
          Book with {SAMPLE_SHOP.name}
        </h2>
        <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">
          Choose a service to continue.
        </p>
        <div className="mt-4 space-y-2">
          {SAMPLE_PACKAGES.map(pkg => (
            <MockRow key={pkg.name} selected={pkg.selected}>
              <MockCheck selected={pkg.selected} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-white">
                  {pkg.name}
                </span>
                <span className="mt-0.5 block text-[10px] font-normal text-zinc-500">
                  {pkg.duration}
                </span>
              </span>
              <span className="shrink-0 text-right leading-none">
                {pkg.from ? (
                  <span className="mb-1 block text-[10px] font-normal text-zinc-400">
                    from
                  </span>
                ) : null}
                <span className="text-[15px] font-bold tabular-nums text-white">
                  {pkg.price}
                </span>
              </span>
            </MockRow>
          ))}
        </div>
        <div className="mt-auto border-t border-white/10 pb-3 pt-3">
          <MockPrimaryButton>Continue</MockPrimaryButton>
        </div>
      </div>
    </div>
  );
}

export function BookingSlotsScreen() {
  return (
    <div className={SCREEN}>
      <MockStatusBar />
      <div className="flex min-h-0 flex-1 flex-col px-3.5">
        <MockStepTracker current={1} />
        <h2 className="text-[15px] font-bold tracking-tight text-white">
          Interior detail
        </h2>
        <span className="mt-1.5 inline-flex w-fit rounded-md bg-white/[0.06] px-2 py-0.5 text-[10px] text-zinc-300">
          SUV
        </span>
        <p className="mt-4 text-[11px] font-semibold tracking-tight text-white">
          Choose date
        </p>
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {SAMPLE_DATES.map(date => (
            <div
              key={date.day}
              className={`rounded-xl border py-2 text-center ${
                date.selected
                  ? 'border-white/30 bg-white text-neutral-950'
                  : 'border-white/10 bg-white/[0.04] text-zinc-300'
              }`}
            >
              <p className="text-[9px] font-medium uppercase tracking-wide opacity-70">
                {date.dow}
              </p>
              <p className="mt-0.5 text-[13px] font-semibold tabular-nums">
                {date.day}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] font-semibold tracking-tight text-white">
          Choose time
        </p>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {SAMPLE_SLOTS.map(slot => (
            <div
              key={slot.time}
              className={`flex min-h-[40px] items-center justify-center rounded-xl text-[12px] font-medium ${
                slot.selected
                  ? 'bg-white text-black'
                  : 'border border-white/10 bg-white/5 text-gray-300'
              }`}
            >
              {slot.time}
            </div>
          ))}
        </div>
        <div className="mt-auto border-t border-white/10 pb-3 pt-3">
          <MockPrimaryButton>Continue</MockPrimaryButton>
        </div>
      </div>
    </div>
  );
}

export function DepositCheckoutScreen() {
  return (
    <div className={SCREEN}>
      <MockStatusBar />
      <div className="flex min-h-0 flex-1 flex-col px-3.5">
        <MockStepTracker current={3} />
        <h2 className="text-[15px] font-bold tracking-tight text-white">
          Review and pay
        </h2>
        <section className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          <div className="space-y-3 p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[13px] font-semibold leading-snug text-white">
                  Interior detail
                </p>
                <span className="mt-1.5 inline-flex rounded-md bg-white/[0.06] px-2 py-0.5 text-[10px] text-zinc-300">
                  SUV
                </span>
              </div>
              <p className="pt-0.5 text-[13px] font-medium tabular-nums text-zinc-200">
                $189.00
              </p>
            </div>
            <div className="border-t border-white/10 pt-3">
              <div className="flex justify-between text-[12px]">
                <span className="text-zinc-200">Pet hair add-on</span>
                <span className="tabular-nums text-zinc-300">+$25.00</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 border-t border-white/10 bg-white/[0.035]">
            <div className="border-r border-white/10 px-3.5 py-3">
              <p className="text-[9px] font-medium uppercase tracking-wider text-zinc-500">
                Duration
              </p>
              <p className="mt-1 text-[12px] font-semibold text-white">2 hr</p>
            </div>
            <div className="px-3.5 py-3 text-right">
              <p className="text-[9px] font-medium uppercase tracking-wider text-zinc-500">
                Total
              </p>
              <p className="mt-1 text-[12px] font-semibold tabular-nums text-white">
                $214.00
              </p>
            </div>
          </div>
        </section>
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3">
          <p className="text-[9px] font-medium uppercase tracking-wider text-zinc-500">
            Due now
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-white">
            $50.00
          </p>
          <p className="mt-0.5 text-[10px] text-zinc-500">
            Deposit on Pro. Balance after the job.
          </p>
        </div>
        <div className="mt-auto border-t border-white/10 pb-3 pt-3">
          <MockPrimaryButton>Pay deposit</MockPrimaryButton>
        </div>
      </div>
    </div>
  );
}

export function VehicleSizeScreen() {
  return (
    <div className={SCREEN}>
      <MockStatusBar />
      <div className="flex min-h-0 flex-1 flex-col px-3.5">
        <MockStepTracker current={0} />
        <h2 className="text-[15px] font-bold tracking-tight text-white">
          Interior detail
        </h2>
        <p className="mt-1 text-[11px] text-zinc-500">Choose a vehicle size.</p>
        <div className="mt-4 space-y-2">
          {SAMPLE_SIZES.map(size => (
            <MockRow key={size.label} selected={size.selected}>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-medium text-white">
                  {size.label}
                </span>
                <span className="mt-0.5 block text-[10px] text-zinc-500">
                  {size.duration}
                </span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-[13px] tabular-nums text-zinc-400">
                  {size.price}
                </span>
                <MockCheck selected={size.selected} />
              </span>
            </MockRow>
          ))}
        </div>
        <div className="mt-auto border-t border-white/10 pb-3 pt-3">
          <MockPrimaryButton>Continue</MockPrimaryButton>
        </div>
      </div>
    </div>
  );
}

export function ServiceAreaLocationScreen() {
  return (
    <div className={SCREEN}>
      <MockStatusBar />
      <div className="flex min-h-0 flex-1 flex-col px-3.5">
        <MockStepTracker current={2} />
        <h2 className="text-[15px] font-semibold tracking-tight text-white">
          Where should we meet you?
        </h2>
        <p className="mt-1 text-[11px] text-zinc-500">
          Mobile service in {SAMPLE_SHOP.coverage}.
        </p>
        <div className="mt-4">
          <MockRow selected>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-semibold text-white">
                Come to me
              </span>
              <span className="mt-1 block text-[11px] leading-relaxed text-zinc-500">
                We come to your driveway. {SAMPLE_SHOP.coverage}
              </span>
            </span>
            <MockCheck selected />
          </MockRow>
        </div>
        <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3">
          <p className="text-[10px] font-medium text-zinc-400">
            Service address
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-zinc-200">
            1806 South Lamar Blvd, Austin, TX
          </p>
        </div>
        <div className="mt-auto border-t border-white/10 pb-3 pt-3">
          <MockPrimaryButton>Continue</MockPrimaryButton>
        </div>
      </div>
    </div>
  );
}

export function ShopAddressLocationScreen() {
  return (
    <div className={SCREEN}>
      <MockStatusBar />
      <div className="flex min-h-0 flex-1 flex-col px-3.5">
        <MockStepTracker current={2} />
        <h2 className="text-[15px] font-semibold tracking-tight text-white">
          Where should we meet you?
        </h2>
        <p className="mt-1 text-[11px] text-zinc-500">
          Come to the shop for this visit.
        </p>
        <div className="mt-4">
          <MockRow selected>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-semibold text-white">
                I&apos;ll come to the shop
              </span>
              <span className="mt-1 block text-[11px] leading-relaxed text-zinc-500">
                Drop off at the address on the page.
              </span>
              <span className="mt-1.5 block text-[11px] leading-relaxed text-zinc-400">
                {SAMPLE_SHOP.shopAddress}
              </span>
            </span>
            <MockCheck selected />
          </MockRow>
        </div>
        <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3">
          <p className="text-[10px] font-medium text-zinc-400">Shop address</p>
          <p className="mt-1 text-[12px] leading-relaxed text-zinc-200">
            {SAMPLE_SHOP.shopAddress}
          </p>
        </div>
        <div className="mt-auto border-t border-white/10 pb-3 pt-3">
          <MockPrimaryButton>Continue</MockPrimaryButton>
        </div>
      </div>
    </div>
  );
}
