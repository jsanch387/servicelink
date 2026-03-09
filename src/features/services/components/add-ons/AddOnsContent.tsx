'use client';

import { Button, Modal } from '@/components/shared';
import { PlusIcon, RectangleStackIcon } from '@heroicons/react/24/outline';
import React, { useCallback, useState } from 'react';
import { AddOnManagementCard } from './AddOnManagementCard';
import { EditAddOnModal } from './EditAddOnModal';
import type { AddOnRow, EditAddOnFormData } from './addOnTypes';
import { MOCK_ADDONS_POOL, nextAddOnId } from './mockAddOnsPool';

/**
 * Add-ons tab content. Manages the global add-on pool.
 * Add, edit, delete add-ons. No service selector.
 */
export const AddOnsContent: React.FC = () => {
  const [addOns, setAddOns] = useState<AddOnRow[]>(() => [...MOCK_ADDONS_POOL]);
  const [editingAddOn, setEditingAddOn] = useState<AddOnRow | null>(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [addOnToDelete, setAddOnToDelete] = useState<AddOnRow | null>(null);

  const handleAddAddOn = useCallback(() => {
    setEditingAddOn(null);
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
    (addOnId: string | undefined, data: EditAddOnFormData) => {
      if (addOnId) {
        setAddOns(prev =>
          prev.map(a =>
            a.id === addOnId
              ? { ...a, name: data.name, price_cents: data.price_cents ?? 0 }
              : a
          )
        );
        setEditingAddOn(null);
      } else {
        const newAddOn: AddOnRow = {
          id: nextAddOnId(),
          name: data.name,
          price_cents: data.price_cents ?? 0,
          sort_order: addOns.length,
        };
        setAddOns(prev => [...prev, newAddOn]);
        setIsAddFormOpen(false);
      }
    },
    [addOns.length]
  );

  const handleDelete = useCallback(
    (addOnId: string) => {
      const addOn = addOns.find(a => a.id === addOnId) ?? null;

      setAddOnToDelete(addOn);
    },
    [addOns]
  );

  const handleConfirmDelete = useCallback(() => {
    if (!addOnToDelete) return;
    setAddOns(prev => prev.filter(a => a.id !== addOnToDelete.id));
    setAddOnToDelete(null);
  }, [addOnToDelete]);

  return (
    <main className="flex-1 py-4 sm:py-8 px-4 sm:px-6 lg:px-8 overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] min-h-screen w-full pb-[max(2rem,env(safe-area-inset-bottom))] sm:pb-8">
      <div className="max-w-2xl mx-auto w-full min-w-0 pt-0 sm:pt-6">
        {addOns.length === 0 ? (
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
              Add optional add-ons like &quot;Pet Hair Removal&quot; or
              &quot;Headlight Restoration&quot; that customers can select when
              booking. Then assign them to services when editing each service.
            </p>
            <Button
              variant="inverse"
              size="md"
              onClick={handleAddAddOn}
              icon={<PlusIcon className="h-5 w-5 text-emerald-500" />}
              className="mt-6"
            >
              Add add-on
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 mb-6 px-0.5">
              <p className="text-white text-lg font-bold">
                {addOns.length} Add-on{addOns.length === 1 ? '' : 's'}
              </p>
              <Button
                variant="inverse"
                size="md"
                onClick={handleAddAddOn}
                icon={<PlusIcon className="h-5 w-5 text-emerald-500" />}
                fullWidth
                className="sm:w-auto"
              >
                Add add-on
              </Button>
            </div>

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
          </>
        )}

        <EditAddOnModal
          addOn={editingAddOn}
          showAddForm={isAddFormOpen}
          onClose={handleCloseEdit}
          onSave={handleSaveAddOn}
        />

        <Modal
          isOpen={!!addOnToDelete}
          onClose={() => setAddOnToDelete(null)}
          title="Delete add-on?"
          maxWidth="sm"
        >
          <p className="text-gray-300 text-sm mb-6">
            Are you sure you want to delete this add-on?
          </p>
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setAddOnToDelete(null)}
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
