'use client';

import { Button } from '@/components/shared';
import { EyeIcon } from '@heroicons/react/24/outline';

export interface EditProfileActionBarProps {
  onPreview: () => void;
  onSave: () => void;
  disabled?: boolean;
  isSaving?: boolean;
  isUploading?: boolean;
}

export function EditProfileActionBar({
  onPreview,
  onSave,
  disabled = false,
  isSaving = false,
  isUploading = false,
}: EditProfileActionBarProps) {
  const saveLabel = isSaving
    ? 'Saving...'
    : isUploading
      ? 'Uploading...'
      : 'Save changes';

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] lg:left-64">
      <div className="pointer-events-auto mx-auto flex max-w-md gap-2 rounded-2xl border border-white/10 bg-[#141414]/95 p-2 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <Button
          onClick={onPreview}
          variant="secondary"
          className="flex-1"
          disabled={disabled}
        >
          <EyeIcon className="h-4 w-4" />
          Preview
        </Button>
        <Button
          onClick={onSave}
          variant="inverse"
          className="flex-1"
          disabled={disabled}
          loading={isSaving}
        >
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}
