'use client';

import { Button, Modal } from '@/components/shared';
import { FolderIcon, PlusIcon } from '@heroicons/react/24/outline';
import React, { useCallback, useMemo, useState } from 'react';
import { CategoryManagementCard } from './CategoryManagementCard';
import { EditCategoryModal } from './EditCategoryModal';
import type {
  EditCategoryFormData,
  ServiceCategoryRow,
} from './categoryTypes';

export interface CategoriesContentProps {
  categories: ServiceCategoryRow[];
  onCategoriesChange: (categories: ServiceCategoryRow[]) => void;
  /** Map of service ID → category ID (for service counts on cards). */
  serviceCategoryIds?: Record<string, string | null>;
  /** Called when a category is deleted so parent can clear service assignments. */
  onCategoryDeleted?: (categoryId: string) => void;
}

/**
 * Categories tab content. UI-only CRUD until backend is wired.
 */
export const CategoriesContent: React.FC<CategoriesContentProps> = ({
  categories,
  onCategoriesChange,
  serviceCategoryIds = {},
  onCategoryDeleted,
}) => {
  const [editingCategory, setEditingCategory] =
    useState<ServiceCategoryRow | null>(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] =
    useState<ServiceCategoryRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const serviceCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const categoryId of Object.values(serviceCategoryIds)) {
      if (categoryId) {
        counts[categoryId] = (counts[categoryId] ?? 0) + 1;
      }
    }
    return counts;
  }, [serviceCategoryIds]);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.sort_order - b.sort_order),
    [categories]
  );

  const handleAddCategory = useCallback(() => {
    setEditingCategory(null);
    setSaveError(null);
    setIsAddFormOpen(true);
  }, []);

  const handleEdit = useCallback((category: ServiceCategoryRow) => {
    setEditingCategory(category);
    setIsAddFormOpen(false);
  }, []);

  const handleCloseEdit = useCallback(() => {
    setEditingCategory(null);
    setIsAddFormOpen(false);
    setSaveError(null);
  }, []);

  const handleSaveCategory = useCallback(
    (categoryId: string | undefined, data: EditCategoryFormData) => {
      setSaveError(null);

      const duplicate = categories.some(
        c =>
          c.name.toLowerCase() === data.name.toLowerCase() &&
          c.id !== categoryId
      );
      if (duplicate) {
        setSaveError('A category with this name already exists.');
        return;
      }

      if (categoryId) {
        onCategoriesChange(
          categories.map(c =>
            c.id === categoryId ? { ...c, name: data.name } : c
          )
        );
        setEditingCategory(null);
        return;
      }

      const nextOrder =
        categories.length > 0
          ? Math.max(...categories.map(c => c.sort_order)) + 1
          : 0;

      const newCategory: ServiceCategoryRow = {
        id: crypto.randomUUID(),
        name: data.name,
        sort_order: nextOrder,
      };
      onCategoriesChange([...categories, newCategory]);
      setIsAddFormOpen(false);
    },
    [categories, onCategoriesChange]
  );

  const handleDelete = useCallback(
    (categoryId: string) => {
      const category = categories.find(c => c.id === categoryId) ?? null;
      setCategoryToDelete(category);
    },
    [categories]
  );

  const handleConfirmDelete = useCallback(() => {
    if (!categoryToDelete) return;
    setDeleteError(null);

    const assignedCount = serviceCountByCategory[categoryToDelete.id] ?? 0;
    if (assignedCount > 0) {
      setDeleteError(
        `This category has ${assignedCount} service${assignedCount === 1 ? '' : 's'} assigned. Move or remove them first.`
      );
      return;
    }

    onCategoriesChange(
      categories.filter(c => c.id !== categoryToDelete.id)
    );
    onCategoryDeleted?.(categoryToDelete.id);
    setCategoryToDelete(null);
  }, [
    categoryToDelete,
    categories,
    onCategoriesChange,
    onCategoryDeleted,
    serviceCountByCategory,
  ]);

  return (
    <main className="flex-1 py-4 sm:py-8 px-4 sm:px-6 lg:px-8 overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] min-h-screen w-full pb-[max(2rem,env(safe-area-inset-bottom))] sm:pb-8">
      <div className="max-w-2xl mx-auto w-full min-w-0 pt-0 sm:pt-6">
        {sortedCategories.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-10 text-center">
            <div className="flex justify-center">
              <div className="rounded-2xl bg-white/5 p-4">
                <FolderIcon className="h-10 w-10 sm:h-12 sm:w-12 text-gray-500" />
              </div>
            </div>
            <h2 className="text-lg font-semibold text-white mt-4">
              No categories yet
            </h2>
            <p className="text-sm text-gray-400 mt-2 max-w-sm mx-auto">
              Create categories to organize your services — like Residential,
              Commercial, or Packages — then assign them when you add a service.
            </p>
            <Button
              variant="inverse"
              onClick={handleAddCategory}
              icon={<PlusIcon className="h-5 w-5 text-emerald-500" />}
              className="mt-6"
            >
              Add category
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 mb-6 px-0.5">
              <p className="text-white text-lg font-bold">
                {sortedCategories.length} Categor
                {sortedCategories.length === 1 ? 'y' : 'ies'}
              </p>
              <Button
                variant="inverse"
                onClick={handleAddCategory}
                icon={<PlusIcon className="h-5 w-5 text-emerald-500" />}
                fullWidth
                className="sm:w-auto"
              >
                Add category
              </Button>
            </div>

            <ul className="space-y-3 sm:space-y-4 list-none p-0 m-0">
              {sortedCategories.map(category => (
                <li key={category.id}>
                  <CategoryManagementCard
                    category={category}
                    serviceCount={serviceCountByCategory[category.id] ?? 0}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                </li>
              ))}
            </ul>
          </>
        )}

        <EditCategoryModal
          category={editingCategory}
          showAddForm={isAddFormOpen}
          saveError={saveError}
          onClose={handleCloseEdit}
          onSave={handleSaveCategory}
        />

        <Modal
          isOpen={!!categoryToDelete}
          onClose={() => {
            setCategoryToDelete(null);
            setDeleteError(null);
          }}
          title="Delete category?"
          maxWidth="sm"
        >
          <p className="text-gray-300 text-sm mb-6">
            Are you sure you want to delete &ldquo;{categoryToDelete?.name}
            &rdquo;?
          </p>
          {deleteError && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
              {deleteError}
            </p>
          )}
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => {
                setCategoryToDelete(null);
                setDeleteError(null);
              }}
              className="w-full sm:w-auto min-h-[48px] flex items-center justify-center px-4 py-3 rounded-xl text-base font-medium border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/10 active:bg-white/15 transition-all cursor-pointer touch-manipulation"
            >
              No
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="w-full sm:flex-1 min-h-[48px] flex items-center justify-center px-4 py-3 rounded-xl text-base font-medium bg-white hover:bg-gray-100 active:bg-gray-200 text-black transition-all cursor-pointer touch-manipulation"
            >
              Yes
            </button>
          </div>
        </Modal>
      </div>
    </main>
  );
};
