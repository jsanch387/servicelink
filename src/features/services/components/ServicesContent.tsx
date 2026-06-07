'use client';

import { Button, Modal } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import {
  FREE_MAX_SERVICES,
  FREE_TIER_SERVICE_LIMIT_USER_MESSAGE,
} from '@/features/pricing/types';
import { buildServiceCategoryFilterOptions } from '@/features/services/categories/utils/buildServiceCategoryFilterOptions';
import { filterServicesByCategoryFilter } from '@/features/services/categories/utils/filterServicesByCategoryFilter';
import {
  applyBucketSortOrder,
  sortServicesForDisplay,
} from '@/features/services/categories/utils/sortServicesForDisplay';
import { shouldShowServiceCategoryFilters } from '@/features/services/categories/utils/shouldShowServiceCategoryFilters';
import {
  SERVICE_CATEGORY_UNCATEGORIZED_FILTER_ID,
  type ServiceCategoryRow,
} from '@/features/services/categories/types/serviceCategories';
import type { ServiceRow } from '@/features/services/types/services';
import {
  InformationCircleIcon,
  PlusIcon,
  RectangleStackIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createServiceAction } from '../actions/createService';
import { deleteServiceAction } from '../actions/deleteService';
import { saveServicesOrderAction } from '../actions/saveServicesOrder';
import { updateServiceAction } from '../actions/updateService';
import { updateServiceIsActiveAction } from '../actions/updateServiceIsActive';
import type { EditServiceFormData } from './EditServiceModal';
import { EditServiceModal } from './EditServiceModal';
import { ServicesCategoryFilterPills } from './ServicesCategoryFilterPills';
import { ServiceManagementCard } from './ServiceManagementCard';
import {
  ServicesTabListHeader,
  ServicesTabStickyAddBar,
} from './ServicesTabListHeader';

export interface ServicesContentProps {
  initialServices: ServiceRow[];
  /** When set, services failed to load; show error state instead of list. */
  fetchError?: string | null;
  /** Map of service ID → add-on count. */
  addOnCounts?: Record<string, number>;
  /** When false, Free-plan service cap applies (derived with live list length). */
  hasProAccess?: boolean;
  /** Service categories from database. */
  categories?: ServiceCategoryRow[];
}

/**
 * Services feature main content.
 * Manage services: edit, reorder, toggle on/off.
 */
export const ServicesContent: React.FC<ServicesContentProps> = ({
  initialServices,
  fetchError = null,
  addOnCounts,
  hasProAccess = true,
  categories = [],
}) => {
  const [services, setServices] = useState<ServiceRow[]>(initialServices);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [reorderList, setReorderList] = useState<ServiceRow[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<ServiceRow | null>(
    null
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('');

  useEffect(() => {
    setServices(sortServicesForDisplay(initialServices, categories));
  }, [initialServices, categories]);

  const orderedServices = useMemo(
    () => sortServicesForDisplay(services, categories),
    [services, categories]
  );

  const freeTierServiceCapReached =
    !hasProAccess && orderedServices.length >= FREE_MAX_SERVICES;

  const showCategoryFilters = useMemo(
    () => shouldShowServiceCategoryFilters(categories, orderedServices),
    [categories, orderedServices]
  );

  const categoryFilterOptions = useMemo(
    () =>
      showCategoryFilters
        ? buildServiceCategoryFilterOptions(categories, orderedServices)
        : [],
    [showCategoryFilters, categories, orderedServices]
  );

  useEffect(() => {
    if (categoryFilterOptions.length === 0) {
      setActiveCategoryFilter('');
      return;
    }
    setActiveCategoryFilter(prev =>
      categoryFilterOptions.some(option => option.id === prev)
        ? prev
        : categoryFilterOptions[0].id
    );
  }, [categoryFilterOptions]);

  const filteredServices = useMemo(() => {
    if (!showCategoryFilters || !activeCategoryFilter) return orderedServices;
    return filterServicesByCategoryFilter(
      orderedServices,
      activeCategoryFilter
    );
  }, [orderedServices, showCategoryFilters, activeCategoryFilter]);

  const displayServices = isReorderMode ? reorderList : filteredServices;

  const hasServicesFilterBar =
    (showCategoryFilters && !isReorderMode) || freeTierServiceCapReached;

  const handleFinishSorting = useCallback(async () => {
    setOrderError(null);
    setIsSavingOrder(true);
    const result = await saveServicesOrderAction(reorderList.map(s => s.id));
    setIsSavingOrder(false);
    if (result.success) {
      const orderedIds = reorderList.map(s => s.id);
      setServices(prev =>
        sortServicesForDisplay(
          applyBucketSortOrder(prev, orderedIds),
          categories
        )
      );
      setIsReorderMode(false);
    } else {
      setOrderError(result.error ?? 'Failed to save order. Please try again.');
    }
  }, [reorderList, categories]);

  const handleSortOrderClick = useCallback(() => {
    if (isReorderMode) {
      handleFinishSorting();
    } else {
      setOrderError(null);
      setReorderList(filteredServices);
      setIsReorderMode(true);
    }
  }, [isReorderMode, handleFinishSorting, filteredServices]);

  const handleToggleActive = useCallback(
    async (serviceId: string, active: boolean) => {
      setToggleError(null);
      const previous = services.find(s => s.id === serviceId);
      setServices(prev =>
        prev.map(s => (s.id === serviceId ? { ...s, is_active: active } : s))
      );
      const result = await updateServiceIsActiveAction(serviceId, active);
      if (!result.success) {
        if (previous) {
          setServices(prev =>
            prev.map(s =>
              s.id === serviceId ? { ...s, is_active: previous.is_active } : s
            )
          );
        }
        setToggleError(result.error ?? 'Failed to update visibility');
      }
    },
    [services]
  );

  const handleCloseEdit = useCallback(() => {
    if (!isSavingEdit) {
      setIsAddServiceOpen(false);
      setSaveError(null);
    }
  }, [isSavingEdit]);

  const handleSaveEdit = useCallback(
    async (serviceId: string | undefined, data: EditServiceFormData) => {
      if (serviceId != null) {
        setSaveError(null);
        setIsSavingEdit(true);
        const result = await updateServiceAction(serviceId, {
          name: data.name,
          description: data.description,
          price_cents: data.price_cents,
          duration_minutes: data.duration_minutes,
        });
        setIsSavingEdit(false);
        if (result.success && result.data) {
          setServices(prev =>
            prev.map(s => (s.id === serviceId ? result.data! : s))
          );
        } else {
          setSaveError(result.error ?? 'Failed to update service');
        }
      } else {
        const atCap = !hasProAccess && services.length >= FREE_MAX_SERVICES;
        if (atCap) {
          setSaveError(FREE_TIER_SERVICE_LIMIT_USER_MESSAGE);
          return;
        }
        setSaveError(null);
        setIsSavingEdit(true);
        const result = await createServiceAction({
          name: data.name,
          description: data.description,
          price_cents: data.price_cents,
          duration_minutes: data.duration_minutes,
          category_id: data.category_id,
        });
        setIsSavingEdit(false);
        if (result.success && result.data) {
          setServices(prev =>
            sortServicesForDisplay([...prev, result.data!], categories)
          );
          setIsAddServiceOpen(false);
        } else {
          setSaveError(result.error ?? 'Failed to add service');
        }
      }
    },
    [hasProAccess, services, categories]
  );

  const handleAddService = useCallback(() => {
    if (freeTierServiceCapReached) return;
    setSaveError(null);
    setToggleError(null);
    setIsAddServiceOpen(true);
  }, [freeTierServiceCapReached]);

  const handleDelete = useCallback(
    (serviceId: string) => {
      setDeleteError(null);
      setToggleError(null);
      const service = services.find(s => s.id === serviceId) ?? null;
      setServiceToDelete(service);
    },
    [services]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!serviceToDelete) return;
    setDeleteError(null);
    setIsDeleting(true);
    const result = await deleteServiceAction(serviceToDelete.id);
    setIsDeleting(false);
    if (result.success) {
      setServices(prev => prev.filter(s => s.id !== serviceToDelete.id));
      setSaveError(null);
      setServiceToDelete(null);
    } else {
      setDeleteError(result.error ?? 'Failed to delete service');
    }
  }, [serviceToDelete]);

  const handleCancelDelete = useCallback(() => {
    setServiceToDelete(null);
    setDeleteError(null);
  }, []);

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

  return (
    <main className="flex-1 flex flex-col min-h-screen bg-[var(--dashboard-bg)] w-full">
      <div className="flex-1 overflow-x-hidden overflow-y-auto pt-3 px-4 sm:px-6 lg:px-8 pb-28">
        <div className="max-w-2xl mx-auto w-full min-w-0">
          {fetchError ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 sm:p-8 text-center">
              <p className="text-red-400 font-medium">
                Could not load services
              </p>
              <p className="text-gray-400 text-sm mt-2">{fetchError}</p>
              <p className="text-gray-500 text-xs mt-4">
                Refresh the page or try again later.
              </p>
            </div>
          ) : services.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-10 text-center">
              <div className="flex justify-center">
                <div className="rounded-2xl bg-white/5 p-4">
                  <RectangleStackIcon className="h-10 w-10 sm:h-12 sm:w-12 text-gray-500" />
                </div>
              </div>
              <h2 className="text-lg font-semibold text-white mt-4">
                No services yet
              </h2>
              <p className="text-sm text-gray-400 mt-2 max-w-sm mx-auto">
                Add your first service here. You can reorder them, turn them on
                or off, and edit details anytime.
              </p>
              <Button
                variant="inverse"
                onClick={handleAddService}
                disabled={freeTierServiceCapReached}
                icon={<PlusIcon className="h-5 w-5 text-black" />}
                className="mt-6"
              >
                Add service
              </Button>
            </div>
          ) : (
            <div className="flex flex-col">
              {hasServicesFilterBar ? (
                <div className="flex flex-col gap-3 sm:gap-3.5">
                  {showCategoryFilters && !isReorderMode ? (
                    <ServicesCategoryFilterPills
                      options={categoryFilterOptions}
                      value={activeCategoryFilter}
                      onChange={setActiveCategoryFilter}
                    />
                  ) : null}

                  {freeTierServiceCapReached ? (
                    <div
                      className="flex items-start gap-2.5 px-0.5"
                      role="note"
                    >
                      <InformationCircleIcon
                        className="h-4 w-4 sm:h-[18px] sm:w-[18px] shrink-0 text-zinc-500 mt-0.5"
                        aria-hidden
                      />
                      <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
                        You&apos;re on the free plan (5 services max).{' '}
                        <Link
                          href={ROUTES.DASHBOARD.UPGRADE}
                          className="font-medium text-white hover:text-white/85 underline-offset-2 hover:underline transition-colors"
                        >
                          Upgrade to Pro
                        </Link>{' '}
                        to add more.
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div
                className={`space-y-5 ${hasServicesFilterBar ? 'mt-6' : ''}`}
              >
                <ServicesTabListHeader
                  countLabel={`${services.length} service${services.length === 1 ? '' : 's'}`}
                  reorder={{
                    onClick: handleSortOrderClick,
                    canReorder: displayServices.length >= 2,
                    isSaving: isSavingOrder,
                    isReorderMode,
                  }}
                />

                {toggleError && (
                  <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                    {toggleError}
                  </p>
                )}

                {isReorderMode ? (
                  <>
                    <p className="text-sm text-gray-500">
                      {showCategoryFilters
                        ? 'Reorder services in this category. Tap the arrows or drag on desktop.'
                        : 'Tap the arrows to move services, or drag to reorder on desktop.'}
                    </p>
                    {orderError ? (
                      <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                        {orderError}
                      </p>
                    ) : null}
                  </>
                ) : null}

                {displayServices.length === 0 ? (
                  <div className="text-center mt-12 sm:mt-16 py-8">
                    <p className="text-sm text-gray-500">
                      No services in this category.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-3 sm:space-y-4 list-none p-0 m-0">
                    {displayServices.map((service, index) => (
                      <li
                        key={`${service.id}-${index}`}
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
                        <ServiceManagementCard
                          service={service}
                          index={index}
                          isReorderMode={isReorderMode}
                          onToggleActive={handleToggleActive}
                          onDelete={handleDelete}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          onMoveUp={handleMoveUp}
                          onMoveDown={handleMoveDown}
                          totalCount={displayServices.length}
                          draggable={isReorderMode}
                          addOnCount={addOnCounts?.[service.id]}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          <EditServiceModal
            service={null}
            showAddForm={isAddServiceOpen}
            saveError={saveError}
            categories={categories}
            initialCategoryId={
              showCategoryFilters &&
              activeCategoryFilter &&
              activeCategoryFilter !== SERVICE_CATEGORY_UNCATEGORIZED_FILTER_ID
                ? activeCategoryFilter
                : null
            }
            onClose={handleCloseEdit}
            onSave={handleSaveEdit}
            isSaving={isSavingEdit}
          />

          <Modal
            isOpen={!!serviceToDelete}
            onClose={handleCancelDelete}
            title="Delete service?"
            maxWidth="sm"
          >
            <p className="text-gray-300 text-sm mb-6">
              Are you sure you want to delete the service?
            </p>
            {deleteError && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
                {deleteError}
              </p>
            )}
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <Button
                type="button"
                onClick={handleCancelDelete}
                variant="secondary"
                disabled={isDeleting}
                className="w-full sm:w-auto"
              >
                No
              </Button>
              <Button
                type="button"
                onClick={handleConfirmDelete}
                variant="danger"
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

      {services.length > 0 && !isReorderMode ? (
        <ServicesTabStickyAddBar
          addLabel="Add service"
          onAdd={handleAddService}
          addDisabled={freeTierServiceCapReached}
        />
      ) : null}
    </main>
  );
};
