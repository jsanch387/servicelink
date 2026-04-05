'use client';

import { Button, Modal } from '@/components/shared';
import { SLUG_MAX_LENGTH, sanitizeSlugInput } from '@/constants/slug';
import React, { useEffect, useState } from 'react';

export interface UpdateBusinessLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  appDomain: string;
  currentSlug: string;
  businessProfileId: string;
  onSaved?: (data: { slug: string; fullLink: string }) => void;
}

export const UpdateBusinessLinkModal: React.FC<
  UpdateBusinessLinkModalProps
> = ({
  isOpen,
  onClose,
  appDomain,
  currentSlug,
  businessProfileId,
  onSaved,
}) => {
  const [draft, setDraft] = useState(currentSlug);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDraft(currentSlug);
      setSaveError(null);
    }
  }, [isOpen, currentSlug]);

  const normalizedDraft = sanitizeSlugInput(draft);
  const normalizedCurrent = sanitizeSlugInput(currentSlug);
  const canSave =
    normalizedDraft.length > 0 && normalizedDraft !== normalizedCurrent;

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  const handleSave = async () => {
    if (!canSave) return;
    setSaveError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/business-profile/slug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessProfileId,
          slugInput: normalizedDraft,
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        setSaveError(result.error ?? 'Could not update your link.');
        return;
      }
      onSaved?.({
        slug: result.data.slug,
        fullLink: result.data.fullLink,
      });
      onClose();
    } catch {
      setSaveError('Something went wrong. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="" maxWidth="md">
      <div className="space-y-6 -mt-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Change your link
          </h2>
          <p className="text-gray-400 text-sm sm:text-base mt-2 leading-relaxed">
            Your old URL will stop working. Pick a new ending, then save.
          </p>
        </div>

        {saveError && (
          <p className="text-sm text-red-400" role="alert">
            {saveError}
          </p>
        )}

        <div className="flex flex-col sm:flex-row rounded-xl border border-white/10 bg-white/[0.04] overflow-hidden focus-within:border-white/30 focus-within:ring-1 focus-within:ring-white/20 min-w-0">
          <span className="py-2.5 px-4 sm:py-3 text-gray-500 font-mono text-xs sm:text-sm border-b border-white/10 sm:border-b-0 sm:border-r flex-shrink-0">
            {appDomain}/
          </span>
          <input
            type="text"
            value={draft}
            onChange={e => setDraft(sanitizeSlugInput(e.target.value))}
            placeholder="my-business"
            maxLength={SLUG_MAX_LENGTH}
            className="flex-1 min-w-0 py-3 px-4 bg-transparent text-white font-mono text-base outline-none placeholder:text-gray-500"
            aria-label="New link slug"
            autoComplete="off"
            autoFocus
            disabled={saving}
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-1">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="inverse"
            onClick={handleSave}
            disabled={!canSave || saving}
            loading={saving}
            className="w-full sm:w-auto"
          >
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
};
