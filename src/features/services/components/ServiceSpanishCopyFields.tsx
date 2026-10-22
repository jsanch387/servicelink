'use client';

import { Button, IconButton, Input, TextArea } from '@/components/shared';
import {
  SERVICE_DESCRIPTION_MAX_LENGTH,
  insertServiceDescriptionBullet,
} from '@/features/business-profile/utils/serviceDescriptionDisplay';
import { ListBulletIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface ServiceSpanishCopyFieldsProps {
  name: string;
  description: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

/**
 * Optional Spanish service copy. The booking link's language decides which
 * version customers see. English name and description stay required.
 */
export function ServiceSpanishCopyFields({
  name,
  description,
  onNameChange,
  onDescriptionChange,
}: ServiceSpanishCopyFieldsProps) {
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const [isOpen, setIsOpen] = useState(
    () => name.trim().length > 0 || description.trim().length > 0
  );

  useEffect(() => {
    if (name.trim().length > 0 || description.trim().length > 0) {
      setIsOpen(true);
    }
  }, [name, description]);

  const handleInsertBullet = useCallback(() => {
    const el = descriptionRef.current;
    const start = el?.selectionStart ?? description.length;
    const end = el?.selectionEnd ?? description.length;
    const { value: next, caret } = insertServiceDescriptionBullet(
      description,
      start,
      end
    );
    onDescriptionChange(next);
    setTimeout(() => {
      const node = descriptionRef.current;
      if (!node) return;
      node.focus();
      node.setSelectionRange(caret, caret);
    }, 0);
  }, [description, onDescriptionChange]);

  const handleCancel = useCallback(() => {
    onNameChange('');
    onDescriptionChange('');
    setIsOpen(false);
  }, [onNameChange, onDescriptionChange]);

  if (!isOpen) {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(true)}
        icon={<PlusIcon className="h-3.5 w-3.5" />}
      >
        Add a second language
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold tracking-tight text-white">
          Spanish
        </h3>
        <Button type="button" variant="ghost" onClick={handleCancel}>
          Cancel
        </Button>
      </div>
      <Input
        label="Spanish name"
        size="compact"
        placeholder="e.g. Detallado completo"
        value={name}
        onChange={onNameChange}
      />
      <TextArea
        ref={descriptionRef}
        label="Spanish description"
        size="compact"
        placeholder="Qué incluye este servicio."
        footerStart={
          <IconButton
            variant="ghost"
            size="sm"
            className="rounded-lg text-emerald-400/90 hover:text-emerald-300 hover:bg-emerald-500/10 -mr-1"
            title="Insert bullet"
            aria-label="Insert bullet in Spanish description"
            icon={<ListBulletIcon className="h-5 w-5" />}
            onClick={handleInsertBullet}
          />
        }
        value={description}
        onChange={onDescriptionChange}
        rows={3}
        maxLength={SERVICE_DESCRIPTION_MAX_LENGTH}
      />
    </div>
  );
}
