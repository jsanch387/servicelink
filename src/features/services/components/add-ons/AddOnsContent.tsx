'use client';

import { Button, Modal } from '@/components/shared';
import {
  createAddOnAction,
  deleteAddOnAction,
  updateAddOnAction,
} from '@/features/services/add-ons';
import { PlusIcon, RectangleStackIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ServicesTabListHeader,
  ServicesTabStickyAddBar,
} from '../ServicesTabListHeader';
import { AddOnManagementCard } from './AddOnManagementCard';
import { EditAddOnModal } from './EditAddOnModal';
import type { AddOnRow, EditAddOnFormData } from './addOnTypes';

export interface AddOnsContentProps {
  /** Add-ons loaded from database. */
  initialAddOns?: AddOnRow[];
  /** Error from fetch (e.g. failed to load add-ons). */
  fetchError?: string | null;
}

/**
 * Add-ons tab content. Displays add-ons from database.
 * Add, edit, delete via server actions.
 */
export const AddOnsContent: React.FC<AddOnsContentProps> = ({
  initialAddOns = [],
  fetchError = null,
}) => {
  const router = useRouter();
  const [addOns, setAddOns] = useState<AddOnRow[]>(initialAddOns);
  const [editingAddOn, setEditingAddOn] = useState<AddOnRow | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setAddOns(initialAddOns);
  }, [initialAddOns]);

  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [addOnToDelete, setAddOnToDelete] = useState<AddOnRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleAddAddOn = useCallback(() => {
    setEditingAddOn(null);
    setSaveError(null);
    setIsAddFormOpen(true);
  }, []);

  const handleEdit = useCallback((addOn: AddOnRow) => {
    setEditingAddOn(addOn);
    setIsAddFormOpen(false);
  }, []);

  const handleCloseEdit = useCallback(() => {
    setEditingAddOn(null);
    setIsAddFormOpen(false);
  }, []);

  const handleSaveAddOn = useCallback(
    async (addOnId: string | undefined, data: EditAddOnFormData) => {
      setSaveError(null);
      setIsSaving(true);

      if (addOnId) {
        const result = await updateAddOnAction(addOnId, {
          name: data.name,
          price_cents: data.price_cents ?? 0,
          duration_minutes: data.duration_minutes,
        });
        setIsSaving(false);

        if (result.success) {
          const updated = result.data;
          if (updated) {
            setAddOns(prev => prev.map(a => (a.id === addOnId ? updated : a)));
          }
          setEditingAddOn(null);
          router.refresh();
        } else {
          setSaveError(result.error ?? 'Failed to update add-on.');
        }
        return;
      }

      const result = await createAddOnAction({
        name: data.name,
        price_cents: data.price_cents ?? 0,
        duration_minutes: data.duration_minutes,
      });
      setIsSaving(false);

      if (result.success) {
        const newAddOn = result.data;
        if (newAddOn) {
          setAddOns(prev => [...prev, newAddOn]);
        }
        setIsAddFormOpen(false);
        router.refresh();
      } else {
        setSaveError(result.error ?? 'Failed to create add-on.');
      }
    },
    [router]
  );

  const handleDelete = useCallback(
    (addOnId: string) => {
      const addOn = addOns.find(a => a.id === addOnId) ?? null;

      setAddOnToDelete(addOn);
    },
    [addOns]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!addOnToDelete) return;
    setDeleteError(null);
    setIsDeleting(true);
    const result = await deleteAddOnAction(addOnToDelete.id);
    setIsDeleting(false);

    if (result.success) {
      setAddOns(prev => prev.filter(a => a.id !== addOnToDelete.id));
      setAddOnToDelete(null);
      router.refresh();
    } else {
      setDeleteError(result.error ?? 'Failed to delete add-on.');
    }
  }, [addOnToDelete, router]);

  return (
    <main className="flex-1 flex flex-col min-h-screen bg-[var(--dashboard-bg)] w-full">
      <div className="flex-1 overflow-x-hidden overflow-y-auto pt-3 px-4 sm:px-6 lg:px-8 pb-28">
        <div className="max-w-2xl mx-auto w-full min-w-0">
          {fetchError ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 sm:p-8 text-center">
              <p className="text-red-400 font-medium">Could not load add-ons</p>
              <p className="text-gray-400 text-sm mt-2">{fetchError}</p>
              <p className="text-gray-500 text-xs mt-4">
                Refresh the page or try again later.
              </p>
            </div>
          ) : addOns.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-10 text-center">
              <div className="flex justify-center">
                <div className="rounded-2xl bg-white/5 p-4">
                  <RectangleStackIcon className="h-10 w-10 sm:h-12 sm:w-12 text-gray-500" />
                </div>
              </div>
              <h2 className="text-lg font-semibold text-white mt-4">
                No add-ons yet
              </h2>
              <p className="text-sm text-gray-400 mt-2 max-w-sm mx-auto">
                Add-ons are extras customers can add to a service. Create them
                here, then pick which ones to offer when you edit each service.
              </p>
              <Button
                variant="inverse"
                onClick={handleAddAddOn}
                icon={<PlusIcon className="h-5 w-5 text-black" />}
                className="mt-6"
              >
                Add add-on
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              <ServicesTabListHeader
                countLabel={`${addOns.length} add-on${addOns.length === 1 ? '' : 's'}`}
              />

              <ul className="space-y-3 sm:space-y-4 list-none p-0 m-0">
                {addOns.map(addOn => (
                  <li key={addOn.id}>
                    <AddOnManagementCard
                      addOn={addOn}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}

          <EditAddOnModal
            addOn={editingAddOn}
            showAddForm={isAddFormOpen}
            saveError={saveError}
            onClose={() => {
              setSaveError(null);
              handleCloseEdit();
            }}
            onSave={handleSaveAddOn}
            isSaving={isSaving}
          />

          <Modal
            isOpen={!!addOnToDelete}
            onClose={() => {
              setAddOnToDelete(null);
              setDeleteError(null);
            }}
            title="Delete add-on?"
            maxWidth="sm"
          >
            <p className="text-gray-300 text-sm mb-6">
              Are you sure you want to delete this add-on?
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
                  setAddOnToDelete(null);
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

      {addOns.length > 0 ? (
        <ServicesTabStickyAddBar addLabel="Add add-on" onAdd={handleAddAddOn} />
      ) : null}
    </main>
  );
};
