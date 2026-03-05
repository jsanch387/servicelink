'use client';

import { Modal } from '@/components/shared';
import type { ServiceRow } from '@/features/services/types/services';
import {
  ArrowsUpDownIcon,
  RectangleStackIcon,
} from '@heroicons/react/24/outline';
import React, { useCallback, useState } from 'react';
import { createServiceAction } from '../actions/createService';
import { deleteServiceAction } from '../actions/deleteService';
import { saveServicesOrderAction } from '../actions/saveServicesOrder';
import { updateServiceAction } from '../actions/updateService';
import { updateServiceIsActiveAction } from '../actions/updateServiceIsActive';
import type { EditServiceFormData } from './EditServiceModal';
import { EditServiceModal } from './EditServiceModal';

/** Thick plus icon for Add service (more visible than Heroicons solid). */
function BoldPlusIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <rect x="10" y="3" width="4" height="18" rx="1.5" />
      <rect x="3" y="10" width="18" height="4" rx="1.5" />
    </svg>
  );
}
import { ServiceManagementCard } from './ServiceManagementCard';

export interface ServicesContentProps {
  initialServices: ServiceRow[];
  /** When set, services failed to load; show error state instead of list. */
  fetchError?: string | null;
}

/**
 * Services feature main content.
 * Manage services: edit, reorder, toggle on/off.
 */
export const ServicesContent: React.FC<ServicesContentProps> = ({
  initialServices,
  fetchError = null,
}) => {
  const [services, setServices] = useState<ServiceRow[]>(initialServices);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingService, setEditingService] = useState<ServiceRow | null>(null);
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

  const handleEdit = useCallback((service: ServiceRow) => {
    setSaveError(null);
    setToggleError(null);
    setEditingService(service);
    setIsAddServiceOpen(false);
  }, []);

  const handleCloseEdit = useCallback(() => {
    if (!isSavingEdit) {
      setEditingService(null);
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
          setEditingService(null);
        } else {
          setSaveError(result.error ?? 'Failed to update service');
        }
      } else {
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
          setServices(prev => [...prev, result.data!]);
          setIsAddServiceOpen(false);
        } else {
          setSaveError(result.error ?? 'Failed to add service');
        }
      }
    },
    []
  );

  const handleAddService = useCallback(() => {
    setSaveError(null);
    setToggleError(null);
    setEditingService(null);
    setIsAddServiceOpen(true);
  }, []);

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
    <main className="flex-1 py-8 sm:py-10 px-4 sm:px-6 lg:px-8 overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] min-h-screen w-full">
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
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 sm:p-10 text-center">
            <div className="flex justify-center">
              <div className="rounded-2xl bg-white/5 p-4">
                <RectangleStackIcon className="h-10 w-10 sm:h-12 sm:w-12 text-gray-500" />
              </div>
            </div>
            <h2 className="text-lg font-semibold text-white mt-4">
              No services yet
            </h2>
            <p className="text-sm text-gray-400 mt-2 max-w-sm mx-auto">
              Add services from your Business Profile. Then come back here to
              reorder them, turn them on or off, and make quick edits.
            </p>
            <button
              type="button"
              onClick={handleAddService}
              className="mt-6 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-gray-100 text-black text-sm font-medium transition-all cursor-pointer"
            >
              <BoldPlusIcon className="h-4 w-4 text-emerald-500" />
              Add service
            </button>
          </div>
        ) : (
          <>
            {/* Controls row: count + Add service + Sort Order / Finish Sorting */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 px-0.5">
              <p className="text-white text-lg font-bold">
                {services.length} Service
                {services.length === 1 ? '' : 's'}
              </p>
              <div className="flex items-center gap-2">
                {!isReorderMode && (
                  <button
                    type="button"
                    onClick={handleAddService}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-gray-100 text-black text-sm font-medium transition-all cursor-pointer"
                  >
                    <BoldPlusIcon className="h-4 w-4 text-emerald-500" />
                    Add service
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSortOrderClick}
                  disabled={isSavingOrder}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                    isReorderMode
                      ? 'bg-white/5 border-white/20 text-white hover:bg-white/10'
                      : 'bg-[var(--dashboard-bg)] border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  <ArrowsUpDownIcon className="h-4 w-4" />
                  {isSavingOrder
                    ? 'Saving…'
                    : isReorderMode
                      ? 'Finish sorting'
                      : 'Sort order'}
                </button>
              </div>
            </div>

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

            {/* Services list — draggable in reorder mode */}
            <ul className="space-y-4 list-none p-0 m-0">
              {services.map((service, index) => (
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
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                    totalCount={services.length}
                    draggable={isReorderMode}
                  />
                </li>
              ))}
            </ul>
          </>
        )}

        <EditServiceModal
          service={editingService}
          showAddForm={isAddServiceOpen}
          saveError={saveError}
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
            <button
              type="button"
              onClick={handleCancelDelete}
              disabled={isDeleting}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-medium border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/10 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              No
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="w-full sm:flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-white hover:bg-gray-100 text-black transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? 'Deleting…' : 'Yes'}
            </button>
          </div>
        </Modal>
      </div>
    </main>
  );
};
