'use client';

import type { BusinessServiceRow } from '@/features/business-profile/types/businessProfile';
import {
  ArrowsUpDownIcon,
  RectangleStackIcon,
} from '@heroicons/react/24/outline';
import React, { useCallback, useState } from 'react';
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
  initialServices: BusinessServiceRow[];
}

/**
 * Services feature main content.
 * Manage services: edit, reorder, toggle on/off.
 */
export const ServicesContent: React.FC<ServicesContentProps> = ({
  initialServices,
}) => {
  const [services, setServices] =
    useState<BusinessServiceRow[]>(initialServices);
  const [activeTab, setActiveTab] = useState<'services' | 'add-ons'>(
    'services'
  );
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingService, setEditingService] =
    useState<BusinessServiceRow | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const handleToggleActive = useCallback(() => {
    // TODO: persist is_active
  }, []);

  const handleEdit = useCallback((service: BusinessServiceRow) => {
    setEditingService(service);
  }, []);

  const handleCloseEdit = useCallback(() => {
    if (!isSavingEdit) setEditingService(null);
  }, [isSavingEdit]);

  const handleSaveEdit = useCallback(
    (serviceId: string, data: EditServiceFormData) => {
      setIsSavingEdit(true);
      setServices(prev =>
        prev.map(s =>
          s.id === serviceId
            ? {
                ...s,
                name: data.name,
                description: data.description || null,
                price_cents: data.price_cents,
                duration_minutes: data.duration_minutes,
                hours_to_complete: data.duration_minutes
                  ? data.duration_minutes / 60
                  : null,
                updated_at: new Date().toISOString(),
              }
            : s
        )
      );
      setIsSavingEdit(false);
      setEditingService(null);
      // TODO: persist to API
    },
    []
  );

  const handleDelete = useCallback((serviceId: string) => {
    // TODO: confirm and delete; serviceId will be used for API call
    void serviceId;
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

  const handleAddService = useCallback(() => {
    // TODO: open add-service flow
  }, []);

  return (
    <main className="flex-1 py-8 sm:py-10 px-4 sm:px-6 lg:px-8 overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] min-h-screen w-full">
      <div className="max-w-2xl mx-auto w-full min-w-0 pt-0 sm:pt-6">
        {/* Tabs: Services | Add-ons */}
        <div className="flex rounded-xl bg-white/5 border border-white/10 p-1 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('services')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'services'
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Services
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('add-ons')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'add-ons'
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Add-ons
          </button>
        </div>

        {activeTab === 'add-ons' ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 sm:p-10 text-center">
            <p className="text-gray-400 text-sm">
              Add-ons coming soon. You’ll be able to create add-ons that
              customers can attach to your services.
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
                  onClick={() => setIsReorderMode(prev => !prev)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border cursor-pointer ${
                    isReorderMode
                      ? 'bg-white/5 border-white/20 text-white hover:bg-white/10'
                      : 'bg-[var(--dashboard-bg)] border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  <ArrowsUpDownIcon className="h-4 w-4" />
                  {isReorderMode ? 'Finish sorting' : 'Sort order'}
                </button>
              </div>
            </div>

            {isReorderMode && (
              <p className="text-sm text-gray-500 mb-4">
                Tap the arrows to move services, or drag to reorder on desktop.
              </p>
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
                    onToggleActive={() => handleToggleActive()}
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
          onClose={handleCloseEdit}
          onSave={handleSaveEdit}
          isSaving={isSavingEdit}
        />
      </div>
    </main>
  );
};
