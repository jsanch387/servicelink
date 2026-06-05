'use client';

import { Input, Modal } from '@/components/shared';
import React, { useCallback, useEffect, useState } from 'react';
import type { EditCategoryFormData, ServiceCategoryRow } from './categoryTypes';

export interface EditCategoryModalProps {
  category: ServiceCategoryRow | null;
  /** When true and category is null, show empty form for adding a new category. */
  showAddForm?: boolean;
  saveError?: string | null;
  onClose: () => void;
  onSave: (categoryId: string | undefined, data: EditCategoryFormData) => void;
  isSaving?: boolean;
}

export const EditCategoryModal: React.FC<EditCategoryModalProps> = ({
  category,
  showAddForm = false,
  saveError = null,
  onClose,
  onSave,
  isSaving = false,
}) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isAddMode = showAddForm && !category;
  const isOpen = !!category || showAddForm;

  useEffect(() => {
    if (category) {
      setName(category.name ?? '');
      setError(null);
    } else if (showAddForm) {
      setName('');
      setError(null);
    }
  }, [category, showAddForm]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const nameTrim = name.trim();
      if (!nameTrim) {
        setError('Category name is required.');
        return;
      }

      setError(null);
      onSave(category?.id, { name: nameTrim });
    },
    [category, name, onSave]
  );

  if (!isOpen) return null;

  const isValid = name.trim().length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isAddMode ? 'Add category' : 'Edit category'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {(error || saveError) && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            {saveError ?? error}
          </p>
        )}

        <Input
          label="Category name"
          placeholder="e.g., Residential, Commercial, Packages"
          value={name}
          onChange={setName}
          required
        />

        <p className="text-xs text-gray-500 leading-relaxed">
          Group related services so customers can browse your menu more easily.
        </p>

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-medium border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/10 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isValid || isSaving}
            className="w-full sm:flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-white hover:bg-gray-100 text-black transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving
              ? isAddMode
                ? 'Adding…'
                : 'Saving…'
              : isAddMode
                ? 'Add category'
                : 'Save changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
