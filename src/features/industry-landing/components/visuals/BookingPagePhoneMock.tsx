import React from 'react';
import { PhoneDeviceFrame } from './PhoneDeviceFrame';

const PACKAGES = [
  { name: 'Interior detail', time: '2 hr', price: '$189', from: true },
  { name: 'Exterior wash', time: '1 hr', price: '$89', from: true },
  { name: 'Full detail', time: '3.5 hr', price: '$279', from: true },
] as const;

const SIZES = [
  { label: 'Sedan', selected: false },
  { label: 'SUV', selected: true },
  { label: 'Truck', selected: false },
] as const;

const SLOTS = [
  { time: '9:00', selected: false },
  { time: '11:30', selected: true },
  { time: '2:00', selected: false },
] as const;

/** Code-drawn customer booking page: packages, vehicle size, time slots. */
export function BookingPagePhoneMock({
  screenshotSrc,
  screenshotAlt,
}: {
  screenshotSrc?: string | null;
  screenshotAlt?: string;
}) {
  return (
    <PhoneDeviceFrame
      screenshotSrc={screenshotSrc}
      screenshotAlt={screenshotAlt}
    >
      <div className="flex h-full flex-col bg-[#0F0F0F] px-3.5 pt-6 text-white">
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#8F8F8F]">
          myservicelink.app/apex
        </p>
        <p className="mt-1.5 text-[17px] font-bold leading-tight tracking-[-0.3px]">
          Apex Mobile Detail
        </p>
        <p className="mt-0.5 text-[11px] text-[#8F8F8F]">Austin, TX · Mobile</p>

        <p className="mt-4 text-[11px] font-semibold text-white">Packages</p>
        <div className="mt-2 flex flex-col gap-1.5">
          {PACKAGES.map(pkg => (
            <div
              key={pkg.name}
              className="flex items-center justify-between rounded-xl border border-[#262626] bg-[#181818] px-2.5 py-2"
            >
              <div>
                <p className="text-[12px] font-semibold leading-4">
                  {pkg.name}
                </p>
                <p className="text-[10px] text-[#8F8F8F]">{pkg.time}</p>
              </div>
              <p className="text-right text-[12px] font-semibold tabular-nums">
                {pkg.from ? (
                  <span className="mr-1 text-[9px] font-normal text-[#8F8F8F]">
                    from
                  </span>
                ) : null}
                {pkg.price}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-4 text-[11px] font-semibold">Vehicle size</p>
        <div className="mt-2 overflow-hidden rounded-xl border border-[#262626] bg-[#181818]">
          {SIZES.map((size, index) => (
            <div
              key={size.label}
              className={`flex items-center gap-2 px-2.5 py-1.5 ${
                size.selected ? 'bg-[#202020]' : ''
              } ${index > 0 ? 'border-t border-[#262626]' : ''}`}
            >
              <span
                className={`flex h-[14px] w-[14px] items-center justify-center rounded-full ${
                  size.selected
                    ? 'border-2 border-white'
                    : 'border border-[#4A4A4A]'
                }`}
                aria-hidden
              >
                {size.selected ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                ) : null}
              </span>
              <span className="text-[11px] font-medium">{size.label}</span>
              {size.selected ? (
                <span className="ml-auto text-[11px] tabular-nums text-white">
                  $189
                </span>
              ) : null}
            </div>
          ))}
        </div>

        <p className="mt-4 text-[11px] font-semibold">Thu · Morning</p>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {SLOTS.map(slot => (
            <div
              key={slot.time}
              className={`flex h-8 items-center justify-center rounded-lg text-[11px] font-semibold ${
                slot.selected
                  ? 'bg-white text-black'
                  : 'bg-[#2A2A2A] text-white'
              }`}
            >
              {slot.time}
            </div>
          ))}
        </div>
      </div>
    </PhoneDeviceFrame>
  );
}
