'use client';

import { Button, Calendar, GlassCard, Input, PriceInput } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { ArrowLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import React, { useMemo, useState } from 'react';

function getTodayAtMidnight() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function getDefaultTime() {
  const now = new Date();
  const rounded = new Date(now);
  rounded.setMinutes(Math.ceil(now.getMinutes() / 15) * 15);
  rounded.setSeconds(0);
  rounded.setMilliseconds(0);
  return rounded.toTimeString().slice(0, 5);
}

export const CreateQuoteScreen: React.FC = () => {
  const [serviceSummary, setServiceSummary] = useState('');
  const [price, setPrice] = useState('');
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [scheduledTime, setScheduledTime] = useState(getDefaultTime);

  const canSend = useMemo(() => {
    return (
      serviceSummary.trim().length > 0 &&
      price.trim().length > 0 &&
      scheduledDate !== null &&
      scheduledTime.trim().length > 0
    );
  }, [price, scheduledDate, scheduledTime, serviceSummary]);

  return (
    <main className="flex-1 pt-6 pb-24 sm:pt-8 sm:pb-8 lg:pt-10 lg:pb-10 px-4 sm:px-6 lg:px-8 overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] min-h-screen w-full">
      <div className="max-w-6xl mx-auto w-full min-w-0">
        <div className="mb-6 sm:mb-8">
          <Button
            href={ROUTES.DASHBOARD.MAIN}
            variant="ghost"
            size="xs"
            className="mb-4 text-gray-300 hover:text-white border border-white/10 hover:border-white/20"
            icon={<ArrowLeftIcon className="h-3.5 w-3.5" />}
          >
            Back to Dashboard
          </Button>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
            Create Quote
          </h1>
          <p className="text-sm sm:text-base text-gray-400 mt-1">
            Step 2: Enter service details, price, and the date/time.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-6 sm:gap-8 items-start">
          <GlassCard
            padding="md"
            rounded="rounded-2xl"
            blurColor="bg-zinc-500"
            showBlur={true}
            className="w-full"
          >
            <div className="space-y-5">
              <Input
                label="Custom Service"
                placeholder='e.g. "3 Muddy Razors"'
                value={serviceSummary}
                onChange={setServiceSummary}
              />

              <PriceInput
                label="Quote Price"
                placeholder="e.g. $600"
                value={price}
                onChange={setPrice}
              />

              <div>
                <label className="block text-left text-sm font-medium text-gray-200 mb-1.5">
                  Time
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={event => setScheduledTime(event.target.value)}
                  className="w-full py-2.5 px-3.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-base sm:text-sm font-normal focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 focus:bg-white/8 transition-all duration-200 touch-manipulation hover:border-white/20 active:bg-white/8"
                />
              </div>

              <div className="pt-2">
                <Button
                  variant="success"
                  fullWidth
                  disabled={!canSend}
                  icon={<PaperAirplaneIcon className="h-4 w-4" />}
                >
                  Send to Client (SMS / Email)
                </Button>
              </div>
            </div>
          </GlassCard>

          <Calendar
            value={scheduledDate}
            onChange={setScheduledDate}
            minDate={getTodayAtMidnight()}
            title="Pick Date"
            subtitle="SOFT BLOCK THIS SLOT"
            className="w-full xl:sticky xl:top-6"
          />
        </div>
      </div>
    </main>
  );
};

export default CreateQuoteScreen;
