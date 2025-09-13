'use client';

import React, { useState } from 'react';
import {
  Button,
  Input,
  TextArea,
  Select,
  PriceInput,
} from '@/components/shared';
import {
  PlusIcon,
  PencilIcon,
  CheckIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { ServiceFormData } from '@/features/business-profile/types/businessProfile';

interface ServicesSectionProps {
  services: ServiceFormData[];
  onServicesChange: (services: ServiceFormData[]) => void;
  errors: string[];
}

const HOURS_OPTIONS = [
  { value: '', label: 'Select hours' },
  { value: '1', label: '1 hour' },
  { value: '2', label: '2 hours' },
  { value: '3', label: '3 hours' },
  { value: '4', label: '4 hours' },
  { value: '5', label: '5 hours' },
  { value: '6', label: '6 hours' },
  { value: '7', label: '7 hours' },
  { value: '8', label: '8 hours' },
  { value: '9', label: '9 hours' },
  { value: '10', label: '10+ hours' },
];

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  services,
  onServicesChange,
  errors,
}) => {
  const [newService, setNewService] = useState<ServiceFormData>({
    name: '',
    description: '',
    price: '',
    hours_to_complete: null,
  });

  const addService = () => {
    if (!newService.name.trim() || !newService.price.trim()) {
      return;
    }

    const serviceToAdd: ServiceFormData = {
      ...newService,
      id: `temp-${Date.now()}`,
      isEditing: false,
    };

    onServicesChange([...services, serviceToAdd]);
    setNewService({
      name: '',
      description: '',
      price: '',
      hours_to_complete: null,
    });
  };

  const editService = (index: number) => {
    onServicesChange(
      services.map((service, i) =>
        i === index
          ? { ...service, isEditing: true }
          : { ...service, isEditing: false }
      )
    );
  };

  const updateService = (
    index: number,
    field: keyof ServiceFormData,
    value: string | number | null
  ) => {
    onServicesChange(
      services.map((service, i) =>
        i === index ? { ...service, [field]: value } : service
      )
    );
  };

  const saveService = (index: number) => {
    onServicesChange(
      services.map((service, i) =>
        i === index ? { ...service, isEditing: false } : service
      )
    );
  };

  const removeService = (index: number) => {
    onServicesChange(services.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4">Services</h3>

      {/* Add Service Form */}
      <div className="mb-8">
        <h4 className="text-lg font-medium text-white mb-6 flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add New Service
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Service Name"
            placeholder="e.g., Full Detail Package"
            value={newService.name}
            onChange={value =>
              setNewService(prev => ({ ...prev, name: value }))
            }
          />

          <PriceInput
            label="Price"
            placeholder="150"
            value={newService.price}
            onChange={value =>
              setNewService(prev => ({ ...prev, price: value }))
            }
          />

          <Select
            label="Hours to Complete"
            options={HOURS_OPTIONS}
            value={newService.hours_to_complete?.toString() || ''}
            onChange={value =>
              setNewService(prev => ({
                ...prev,
                hours_to_complete: value ? parseInt(value) : null,
              }))
            }
          />

          <div className="md:col-span-2">
            <TextArea
              label="Description"
              placeholder="Describe what this service includes..."
              value={newService.description}
              onChange={value =>
                setNewService(prev => ({ ...prev, description: value }))
              }
              rows={3}
            />
          </div>
        </div>

        <Button
          onClick={addService}
          variant="primary"
          className="mt-6"
          disabled={!newService.name.trim() || !newService.price.trim()}
          icon={<PlusIcon className="h-4 w-4" />}
        >
          Add Service
        </Button>
      </div>

      {/* Services List */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-white">
          Your Services ({services.length})
        </h4>

        {services.length === 0 ? (
          <div className="bg-neutral-700 rounded-lg p-8 text-center">
            <p className="text-gray-400 mb-2">No services added yet</p>
            <p className="text-sm text-gray-500">
              Add your first service using the form above
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((service, index) => (
              <div
                key={service.id || index}
                className="bg-neutral-700 rounded-lg p-4 relative group"
              >
                {service.isEditing ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div className="space-y-4">
                      <Input
                        label="Service Name"
                        value={service.name}
                        onChange={value => updateService(index, 'name', value)}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <PriceInput
                          label="Price"
                          value={service.price}
                          onChange={value =>
                            updateService(index, 'price', value)
                          }
                        />
                        <Select
                          label="Hours"
                          options={HOURS_OPTIONS}
                          value={service.hours_to_complete?.toString() || ''}
                          onChange={value =>
                            updateService(
                              index,
                              'hours_to_complete',
                              value ? parseInt(value) : null
                            )
                          }
                        />
                      </div>
                      <TextArea
                        label="Description"
                        value={service.description}
                        onChange={value =>
                          updateService(index, 'description', value)
                        }
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => saveService(index)}
                        variant="primary"
                        size="sm"
                        icon={<CheckIcon className="h-4 w-4" />}
                      >
                        Save
                      </Button>
                      <Button
                        onClick={() => removeService(index)}
                        variant="secondary"
                        size="sm"
                        icon={<TrashIcon className="h-4 w-4" />}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="text-white font-medium text-lg">
                          {service.name}
                        </h5>
                        {service.description && (
                          <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                            {service.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => editService(index)}
                          className="p-1 hover:bg-neutral-600 rounded"
                          title="Edit service"
                        >
                          <PencilIcon className="h-4 w-4 text-gray-400 hover:text-white" />
                        </button>
                        <button
                          onClick={() => removeService(index)}
                          className="p-1 hover:bg-neutral-600 rounded"
                          title="Delete service"
                        >
                          <TrashIcon className="h-4 w-4 text-gray-400 hover:text-red-400" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-orange-500 font-semibold text-lg">
                        ${service.price}
                      </span>
                      {service.hours_to_complete && (
                        <span className="text-gray-400 text-sm">
                          {service.hours_to_complete}h
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
