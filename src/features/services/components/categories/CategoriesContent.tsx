'use client';

import { Button, Modal } from '@/components/shared';
import {
  createServiceCategoryAction,
  deleteServiceCategoryAction,
  saveServiceCategoriesOrderAction,
  updateServiceCategoryAction,
} from '@/features/services/categories';
import { sortOrderForBucketIndex } from '@/features/services/categories/utils/sortServicesForDisplay';
import type { ServiceRow } from '@/features/services/types/services';
import { FolderIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ServicesTabListHeader,
  ServicesTabStickyAddBar,
} from '../ServicesTabListHeader';
import { CategoryManagementCard } from './CategoryManagementCard';
import { EditCategoryModal } from './EditCategoryModal';
import type { EditCategoryFormData, ServiceCategoryRow } from './categoryTypes';

export interface CategoriesContentProps {
  /** Categories loaded from database. */
  initialCategories?: ServiceCategoryRow[];
  /** Services used to show assignment counts on category cards. */
  initialServices?: ServiceRow[];
  /** Error from categories fetch. */
  fetchError?: string | null;
}

/**
 * Categories tab content. Loads from DB; create, edit, delete via server actions.
 */
export const CategoriesContent: React.FC<CategoriesContentProps> = ({
  initialCategories = [],
  initialServices = [],
  fetchError = null,
}) => {
  const router = useRouter();
  const [categories, setCategories] =
    useState<ServiceCategoryRow[]>(initialCategories);
  const [editingCategory, setEditingCategory] =
    useState<ServiceCategoryRow | null>(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] =
    useState<ServiceCategoryRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [reorderList, setReorderList] = useState<ServiceCategoryRow[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const serviceCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const service of initialServices) {
      if (service.category_id) {
        counts[service.category_id] = (counts[service.category_id] ?? 0) + 1;
      }
    }
    return counts;
  }, [initialServices]);

  const sortedCategories = useMemo(
    () =>
      [...categories].sort((a, b) => {
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
        return a.created_at.localeCompare(b.created_at);
      }),
    [categories]
  );

  const displayCategories = isReorderMode ? reorderList : sortedCategories;

  const handleFinishSorting = useCallback(async () => {
    setOrderError(null);
    setIsSavingOrder(true);
    const result = await saveServiceCategoriesOrderAction(
      reorderList.map(c => c.id)
    );
    setIsSavingOrder(false);

    if (result.success) {
      const sortOrderById = new Map(
        reorderList.map((category, index) => [
          category.id,
          sortOrderForBucketIndex(index),
        ])
      );
      setCategories(prev =>
        [...prev]
          .map(category => {
            const nextOrder = sortOrderById.get(category.id);
            return nextOrder !== undefined
              ? { ...category, sort_order: nextOrder }
              : category;
          })
          .sort((a, b) => {
            if (a.sort_order !== b.sort_order)
              return a.sort_order - b.sort_order;
            return a.created_at.localeCompare(b.created_at);
          })
      );
      setIsReorderMode(false);
      router.refresh();
    } else {
      setOrderError(result.error ?? 'Failed to save order. Please try again.');
    }
  }, [reorderList, router]);

  const handleSortOrderClick = useCallback(() => {
    if (isReorderMode) {
      handleFinishSorting();
    } else {
      setOrderError(null);
      setReorderList(sortedCategories);
      setIsReorderMode(true);
    }
  }, [isReorderMode, handleFinishSorting, sortedCategories]);

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('text/plain');
    const dragIndex = parseInt(raw, 10);
    if (Number.isNaN(dragIndex) || dragIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }
    setReorderList(prev => {
      const next = [...prev];
      const [removed] = next.splice(dragIndex, 1);
      next.splice(dropIndex, 0, removed);
      return next;
    });
    setDraggedIndex(null);
  }, []);

  const handleMoveUp = useCallback((index: number) => {
    setReorderList(prev => {
      if (index <= 0) return prev;
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }, []);

  const handleMoveDown = useCallback((index: number) => {
    setReorderList(prev => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }, []);

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
    async (categoryId: string | undefined, data: EditCategoryFormData) => {
      setSaveError(null);
      setIsSaving(true);

      if (categoryId) {
        const result = await updateServiceCategoryAction(categoryId, {
          name: data.name,
        });
        setIsSaving(false);

        if (result.success && result.data) {
          setCategories(prev =>
            prev.map(c => (c.id === categoryId ? result.data! : c))
          );
          setEditingCategory(null);
          router.refresh();
        } else {
          setSaveError(result.error ?? 'Failed to update category.');
        }
        return;
      }

      const result = await createServiceCategoryAction({ name: data.name });
      setIsSaving(false);

      if (result.success && result.data) {
        setCategories(prev => [...prev, result.data!]);
        setIsAddFormOpen(false);
        router.refresh();
      } else {
        setSaveError(result.error ?? 'Failed to create category.');
      }
    },
    [router]
  );

  const handleDelete = useCallback(
    (categoryId: string) => {
      const category = categories.find(c => c.id === categoryId) ?? null;
      setCategoryToDelete(category);
    },
    [categories]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!categoryToDelete) return;
    setDeleteError(null);
    setIsDeleting(true);
    const result = await deleteServiceCategoryAction(categoryToDelete.id);
    setIsDeleting(false);

    if (result.success) {
      setCategories(prev => prev.filter(c => c.id !== categoryToDelete.id));
      setCategoryToDelete(null);
      router.refresh();
    } else {
      setDeleteError(result.error ?? 'Failed to delete category.');
    }
  }, [categoryToDelete, router]);

  return (
    <main className="flex-1 flex flex-col min-h-screen bg-[var(--dashboard-bg)] w-full">
      <div className="flex-1 overflow-x-hidden overflow-y-auto pt-3 px-4 sm:px-6 lg:px-8 pb-28">
        <div className="max-w-2xl mx-auto w-full min-w-0">
          {fetchError ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 sm:p-8 text-center">
              <p className="text-red-400 font-medium">
                Could not load categories
              </p>
              <p className="text-gray-400 text-sm mt-2">{fetchError}</p>
              <p className="text-gray-500 text-xs mt-4">
                Refresh the page or try again later.
              </p>
            </div>
          ) : sortedCategories.length === 0 ? (
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
                Group related services together so your menu is easier to
                browse. Pick a category when you edit a service.
              </p>
              <Button
                variant="inverse"
                onClick={handleAddCategory}
                icon={<PlusIcon className="h-5 w-5 text-black" />}
                className="mt-6"
              >
                Add category
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              <ServicesTabListHeader
                countLabel={`${sortedCategories.length} categor${sortedCategories.length === 1 ? 'y' : 'ies'}`}
                reorder={{
                  onClick: handleSortOrderClick,
                  canReorder: sortedCategories.length >= 2,
                  isSaving: isSavingOrder,
                  isReorderMode,
                }}
              />

              {isReorderMode ? (
                <>
                  <p className="text-sm text-gray-500">
                    Tap the arrows to move categories, or drag to reorder on
                    desktop.
                  </p>
                  {orderError ? (
                    <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                      {orderError}
                    </p>
                  ) : null}
                </>
              ) : null}

              <ul className="space-y-3 sm:space-y-4 list-none p-0 m-0">
                {displayCategories.map((category, index) => (
                  <li
                    key={category.id}
                    onDragOver={isReorderMode ? handleDragOver : undefined}
                    onDrop={
                      isReorderMode
                        ? (e: React.DragEvent) => handleDrop(e, index)
                        : undefined
                    }
                    className={
                      isReorderMode && draggedIndex === index
                        ? 'opacity-60 scale-[0.98] transition-all'
                        : ''
                    }
                  >
                    <CategoryManagementCard
                      category={category}
                      index={index}
                      serviceCount={serviceCountByCategory[category.id] ?? 0}
                      isReorderMode={isReorderMode}
                      totalCount={displayCategories.length}
                      draggable={isReorderMode}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onMoveUp={handleMoveUp}
                      onMoveDown={handleMoveDown}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}

          <EditCategoryModal
            category={editingCategory}
            showAddForm={isAddFormOpen}
            saveError={saveError}
            onClose={handleCloseEdit}
            onSave={handleSaveCategory}
            isSaving={isSaving}
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
              &rdquo;? Services in this category will become uncategorized.
            </p>
            {deleteError && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
                {deleteError}
              </p>
            )}
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <Button
                type="button"
                onClick={() => {
                  setCategoryToDelete(null);
                  setDeleteError(null);
                }}
                variant="secondary"
                disabled={isDeleting}
                className="w-full sm:w-auto"
              >
                No
              </Button>
              <Button
                type="button"
                onClick={handleConfirmDelete}
                variant="inverse"
                loading={isDeleting}
                disabled={isDeleting}
                className="w-full sm:flex-1"
              >
                {isDeleting ? 'Deleting' : 'Yes'}
              </Button>
            </div>
          </Modal>
        </div>
      </div>

      {sortedCategories.length > 0 && !isReorderMode ? (
        <ServicesTabStickyAddBar
          addLabel="Add category"
          onAdd={handleAddCategory}
        />
      ) : null}
    </main>
  );
};
