'use client';

import { Button, Modal } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import {
  FREE_MAX_SERVICES,
  FREE_TIER_SERVICE_LIMIT_USER_MESSAGE,
} from '@/features/pricing/types';
import type { ServiceCategoryRow } from '@/features/services/components/categories/categoryTypes';
import { groupServicesByCategory } from '@/features/services/components/categories/groupServicesByCategory';
import type { ServiceRow } from '@/features/services/types/services';
import {
  ArrowsUpDownIcon,
  FolderIcon,
  InformationCircleIcon,
  PlusIcon,
  RectangleStackIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import React, { useCallback, useMemo, useState } from 'react';
import { createServiceAction } from '../actions/createService';
import { deleteServiceAction } from '../actions/deleteService';
import { saveServicesOrderAction } from '../actions/saveServicesOrder';
import { updateServiceAction } from '../actions/updateService';
import { updateServiceIsActiveAction } from '../actions/updateServiceIsActive';
import type { EditServiceFormData } from './EditServiceModal';
import { EditServiceModal } from './EditServiceModal';

import { ServiceManagementCard } from './ServiceManagementCard';

export interface ServicesContentProps {
  initialServices: ServiceRow[];
  /** When set, services failed to load; show error state instead of list. */
  fetchError?: string | null;
  /** Map of service ID → add-on count. */
  addOnCounts?: Record<string, number>;
  /** When false, Free-plan service cap applies (derived with live list length). */
  hasProAccess?: boolean;
  /** Available service categories (UI state until backend). */
  categories?: ServiceCategoryRow[];
  /** Map of service ID → category ID. */
  serviceCategoryIds?: Record<string, string | null>;
  /** Called when a service is assigned a category on create. */
  onServiceCategoryAssign?: (
    serviceId: string,
    categoryId: string | null
  ) => void;
  /** Switch to the Categories tab. */
  onManageCategories?: () => void;
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
  serviceCategoryIds = {},
  onServiceCategoryAssign,
  onManageCategories,
}) => {
  const [services, setServices] = useState<ServiceRow[]>(initialServices);
  const [isReorderMode, setIsReorderMode] = useState(false);
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

  const freeTierServiceCapReached =
    !hasProAccess && services.length >= FREE_MAX_SERVICES;

  const hasCategories = categories.length > 0;

  const serviceGroups = useMemo(
    () =>
      hasCategories && !isReorderMode
        ? groupServicesByCategory(services, categories, serviceCategoryIds)
        : [{ category: null, services }],
    [services, categories, serviceCategoryIds, hasCategories, isReorderMode]
  );

  const flatServicesForReorder = services;

  const handleFinishSorting = useCallback(async () => {
    setOrderError(null);
    setIsSavingOrder(true);
    const result = await saveServicesOrderAction(services.map(s => s.id));
    setIsSavingOrder(false);
    if (result.success) {
      setIsReorderMode(false);
    } else {
      setOrderError(result.error ?? 'Failed to save order. Please try again.');
    }
  }, [services]);

  const handleSortOrderClick = useCallback(() => {
    if (isReorderMode) {
      handleFinishSorting();
    } else {
      setOrderError(null);
      setIsReorderMode(true);
    }
  }, [isReorderMode, handleFinishSorting]);

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
        });
        setIsSavingEdit(false);
        if (result.success && result.data) {
          if (data.category_id) {
            onServiceCategoryAssign?.(result.data.id, data.category_id);
          }
          setServices(prev => [...prev, result.data!]);
          setIsAddServiceOpen(false);
        } else {
          setSaveError(result.error ?? 'Failed to add service');
        }
      }
    },
    [hasProAccess, services, onServiceCategoryAssign]
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
    setServices(prev => {
      const next = [...prev];
      const [removed] = next.splice(dragIndex, 1);
      next.splice(dropIndex, 0, removed);
      return next;
    });
    setDraggedIndex(null);
  }, []);

  const handleMoveUp = useCallback((index: number) => {
    setServices(prev => {
      if (index <= 0) return prev;
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }, []);

  const handleMoveDown = useCallback((index: number) => {
    setServices(prev => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }, []);

  return (
    <main className="flex-1 py-4 sm:py-8 px-4 sm:px-6 lg:px-8 overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] min-h-screen w-full pb-[max(2rem,env(safe-area-inset-bottom))] sm:pb-8">
      <div className="max-w-2xl mx-auto w-full min-w-0 pt-0 sm:pt-6">
        {fetchError ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 sm:p-8 text-center">
            <p className="text-red-400 font-medium">Could not load services</p>
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
              Add your first service here. You can reorder them, turn them on or
              off, and edit details anytime.
            </p>
            <Button
              variant="inverse"
              onClick={handleAddService}
              disabled={freeTierServiceCapReached}
              icon={<PlusIcon className="h-5 w-5 text-emerald-500" />}
              className="mt-6"
            >
              Add service
            </Button>
          </div>
        ) : (
          <>
            {/* Controls row — mobile-first: stack on very small, wrap on larger */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-4 mb-6 px-0.5">
              <p className="text-white text-lg font-bold">
                {services.length} Service
                {services.length === 1 ? '' : 's'}
              </p>
              <div className="flex gap-2">
                {!isReorderMode && (
                  <Button
                    variant="inverse"
                    onClick={handleAddService}
                    disabled={freeTierServiceCapReached}
                    icon={<PlusIcon className="h-4 w-4 text-emerald-500" />}
                    className="flex-1 sm:flex-none"
                  >
                    Add service
                  </Button>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleSortOrderClick}
                  disabled={isSavingOrder}
                  icon={<ArrowsUpDownIcon className="h-4 w-4" />}
                  className={`flex-1 sm:flex-none ${
                    isReorderMode
                      ? '!bg-white/10 !border-white/30 !text-white'
                      : '!bg-[var(--dashboard-bg)] !border-white/10 !text-gray-400 hover:!text-white hover:!border-white/20'
                  }`}
                >
                  {isSavingOrder
                    ? 'Saving…'
                    : isReorderMode
                      ? 'Finish sorting'
                      : 'Sort order'}
                </Button>
              </div>
            </div>

            {freeTierServiceCapReached ? (
              <div className="flex items-start gap-2.5 mb-6 px-0.5" role="note">
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

            {!hasCategories ? (
              <button
                type="button"
                onClick={onManageCategories}
                className="w-full mb-6 flex items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-3.5 text-left hover:border-emerald-500/30 hover:bg-emerald-500/[0.03] transition-all cursor-pointer touch-manipulation"
              >
                <div className="rounded-xl bg-white/5 p-2 shrink-0">
                  <FolderIcon className="h-5 w-5 text-emerald-500/80" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">
                    Organize with categories
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Group services like Residential, Commercial, or Packages.
                  </p>
                </div>
              </button>
            ) : null}

            {toggleError && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
                {toggleError}
              </p>
            )}

            {isReorderMode && (
              <>
                <p className="text-sm text-gray-500 mb-4">
                  Tap the arrows to move services, or drag to reorder on
                  desktop.
                </p>
                {orderError && (
                  <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
                    {orderError}
                  </p>
                )}
              </>
            )}

            {/* Services list — flat when reordering, grouped by category otherwise */}
            {isReorderMode ? (
              <ul className="space-y-3 sm:space-y-4 list-none p-0 m-0">
                {flatServicesForReorder.map((service, index) => (
                  <li
                    key={`${service.id}-${index}`}
                    onDragOver={handleDragOver}
                    onDrop={(e: React.DragEvent) => handleDrop(e, index)}
                    className={
                      draggedIndex === index
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
                      totalCount={services.length}
                      draggable
                      addOnCount={addOnCounts?.[service.id]}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="space-y-8">
                {serviceGroups.map(group => (
                  <section key={group.category?.id ?? 'uncategorized'}>
                    {hasCategories && group.category ? (
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3 px-0.5">
                        {group.category.name}
                      </h2>
                    ) : hasCategories && !group.category ? (
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3 px-0.5">
                        Uncategorized
                      </h2>
                    ) : null}
                    <ul className="space-y-3 sm:space-y-4 list-none p-0 m-0">
                      {group.services.map(service => {
                        const index = services.findIndex(s => s.id === service.id);
                        return (
                          <li key={service.id}>
                            <ServiceManagementCard
                              service={service}
                              index={index}
                              isReorderMode={false}
                              onToggleActive={handleToggleActive}
                              onDelete={handleDelete}
                              totalCount={services.length}
                              addOnCount={addOnCounts?.[service.id]}
                            />
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </>
        )}

        <EditServiceModal
          service={null}
          showAddForm={isAddServiceOpen}
          saveError={saveError}
          categories={categories}
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
              {isDeleting ? 'Deleting…' : 'Yes'}
            </Button>
          </div>
        </Modal>
      </div>
    </main>
  );
};
