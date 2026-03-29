'use client';

import { Button, GlassCard, MoneyInput, Switch } from '@/components/shared';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';

export const PaymentsDepositSettingsCard: React.FC = () => {
  const [savedRequireDeposit, setSavedRequireDeposit] = useState(true);
  const [savedDepositAmount, setSavedDepositAmount] = useState('50');

  const [requireDeposit, setRequireDeposit] = useState(true);
  const [depositAmount, setDepositAmount] = useState('50');

  const isDirty =
    requireDeposit !== savedRequireDeposit ||
    depositAmount !== savedDepositAmount;

  const handleSave = () => {
    // TODO: persist deposit settings (API).
    setSavedRequireDeposit(requireDeposit);
    setSavedDepositAmount(depositAmount);
  };

  return (
    <GlassCard padding="none" rounded="rounded-2xl" className="overflow-hidden">
      <div className="p-4 sm:px-8 sm:pt-8 sm:pb-6">
        <h2 className="text-lg font-semibold text-white">Deposits</h2>
        <p className="mt-1 text-sm text-gray-400">
          Require an upfront deposit before a booking is confirmed (preview UI).
        </p>

        <div className="mt-6 space-y-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
            <Switch
              checked={requireDeposit}
              onCheckedChange={setRequireDeposit}
              size="sm"
              label="Require deposit"
              description="Customers pay a deposit when they book online."
            />
          </div>

          <div
            className={`space-y-4 transition-opacity ${requireDeposit ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}
            aria-hidden={!requireDeposit}
          >
            <MoneyInput
              label="Deposit amount"
              placeholder="0.00"
              value={depositAmount}
              onChange={setDepositAmount}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500 sm:max-w-xs">
            {isDirty
              ? 'You have unsaved changes.'
              : 'Your deposit settings are up to date.'}
          </p>
          <Button
            type="button"
            variant="inverse"
            size="sm"
            disabled={!isDirty}
            onClick={handleSave}
            className="w-full sm:w-auto shrink-0"
          >
            Save changes
          </Button>
        </div>
      </div>

      <footer className="border-t border-white/[0.08] bg-black/20 px-4 py-3.5 sm:px-8 sm:py-3.5">
        <p className="flex gap-2 text-xs sm:text-sm text-gray-400 leading-snug">
          <InformationCircleIcon
            className="h-4 w-4 shrink-0 text-gray-500 mt-0.5"
            aria-hidden
          />
          <span>
            Businesses who require a deposit usually see fewer no-shows.
          </span>
        </p>
      </footer>
    </GlassCard>
  );
};
