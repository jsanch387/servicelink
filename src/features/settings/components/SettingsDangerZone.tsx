'use client';

import { DeleteAccountSection } from '@/features/account';
import React from 'react';

export interface SettingsDangerZoneProps {
  accountEmail: string;
}

export const SettingsDangerZone: React.FC<SettingsDangerZoneProps> = ({
  accountEmail,
}) => (
  <section className="w-full min-w-0 border-t border-white/10 pt-7">
    <h2 className="mb-3 text-base font-semibold text-white">Danger zone</h2>
    <DeleteAccountSection accountEmail={accountEmail} embedded />
  </section>
);
