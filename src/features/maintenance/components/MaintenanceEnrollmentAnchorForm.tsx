'use client';

import { Button } from '@/components/shared';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface MaintenanceEnrollmentAnchorFormProps {
  token: string;
}

export function MaintenanceEnrollmentAnchorForm({
  token,
}: MaintenanceEnrollmentAnchorFormProps) {
  const router = useRouter();
  const [anchorDate, setAnchorDate] = useState('');
  const [anchorTime, setAnchorTime] = useState('10:00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/public/maintenance-enrollment/anchor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          anchorDate: anchorDate.trim(),
          anchorTime: anchorTime.trim().slice(0, 5),
        }),
      });
      const json = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !json.success) {
        setError(json.error || 'Could not save. Please try again.');
        return;
      }
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canSave = anchorDate.trim() !== '' && anchorTime.trim() !== '';

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-400">
        No date chosen yet. Choose a date and time that work for your
        maintenance detail.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor="maint-anchor-date"
            className="mb-1.5 block text-xs font-medium text-gray-400"
          >
            Maintenance date
          </label>
          <input
            id="maint-anchor-date"
            type="date"
            value={anchorDate}
            onChange={e => setAnchorDate(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-white/25 focus:outline-none focus:ring-2 focus:ring-white/15 [color-scheme:dark]"
          />
        </div>
        <div>
          <label
            htmlFor="maint-anchor-time"
            className="mb-1.5 block text-xs font-medium text-gray-400"
          >
            Preferred time
          </label>
          <input
            id="maint-anchor-time"
            type="time"
            value={anchorTime}
            onChange={e => setAnchorTime(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-white/25 focus:outline-none focus:ring-2 focus:ring-white/15 [color-scheme:dark]"
          />
        </div>
      </div>
      {error ? (
        <p className="text-sm text-red-300" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        fullWidth
        loading={loading}
        disabled={!canSave || loading}
        onClick={() => void save()}
      >
        Save date
      </Button>
    </div>
  );
}
