import { ServiceCard } from '@/features/business-profile';

export interface BookServicePickerItem {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  hours_to_complete: number | null;
  duration_minutes: number | null;
}

export interface BookServicePickerProps {
  businessSlug: string;
  businessName: string;
  services: BookServicePickerItem[];
  /**
   * True when opened from the dashboard (owner booking on a customer's behalf).
   * Uses the same ServiceCard + Select control as the public profile; copy reflects owner flow.
   */
  isOwnerManualBooking?: boolean;
}

/**
 * First step when visiting /[slug]/book without a service: choose a service,
 * then continue to /book/details (add-ons if any) and the calendar.
 */
export function BookServicePicker({
  businessSlug,
  businessName,
  services,
  isOwnerManualBooking = false,
}: BookServicePickerProps) {
  if (services.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-8 text-center">
        <p className="text-gray-300 text-base font-medium">
          {isOwnerManualBooking
            ? 'No services to pick yet.'
            : 'No services yet.'}
        </p>
        <p className="text-gray-500 text-sm mt-2 leading-relaxed">
          {isOwnerManualBooking
            ? 'Go to Services in your dashboard. Add a service, then come back here.'
            : 'Services will show up here when this business adds them.'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[50vh] pt-2">
      <header className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          {isOwnerManualBooking
            ? 'Create new appointment'
            : `Book with ${businessName}`}
        </h1>
        <p className="text-sm text-gray-400 mt-1 leading-relaxed">
          {isOwnerManualBooking
            ? 'You are creating a new appointment. Choose a service below to continue.'
            : 'Pick a service. You can add extras next if there are any. Then pick date and time.'}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4" role="list">
        {services.map(s => (
          <div key={s.id} role="listitem">
            <ServiceCard
              service={{
                id: s.id,
                name: s.name,
                description: s.description ?? '',
                price: s.priceCents,
                hours_to_complete: s.hours_to_complete,
                duration_minutes: s.duration_minutes,
              }}
              isEditable={false}
              isPublic
              businessSlug={businessSlug}
              manualBookingForCustomer={isOwnerManualBooking}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
