import type { PublicBookingFlowLocale } from '@/constants/routes';
import { ServiceCard } from '@/features/business-profile';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';

export interface BookServicePickerItem {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  priceOptionsEnabled: boolean;
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
  bookingFlowLocale?: PublicBookingFlowLocale;
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
  bookingFlowLocale = 'en',
}: BookServicePickerProps) {
  const ui = publicBookingUi(bookingFlowLocale);
  if (services.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.04] p-8 text-center">
        <p className="text-gray-300 text-base font-medium">
          {isOwnerManualBooking
            ? ui.bookPicker.noServicesOwnerTitle
            : ui.bookPicker.noServicesPublicTitle}
        </p>
        <p className="text-gray-500 text-sm mt-2 leading-relaxed">
          {isOwnerManualBooking
            ? ui.bookPicker.noServicesOwnerBody
            : ui.bookPicker.noServicesPublicBody}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[50vh] pt-2">
      <header className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          {isOwnerManualBooking
            ? ui.bookPicker.createAppointmentTitle
            : ui.bookPicker.bookWithTitle(businessName)}
        </h1>
        <p className="text-sm text-gray-400 mt-1 leading-relaxed">
          {isOwnerManualBooking
            ? ui.bookPicker.createAppointmentSubtitle
            : ui.bookPicker.bookWithSubtitle}
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
                priceOptionsEnabled: s.priceOptionsEnabled,
                hours_to_complete: s.hours_to_complete,
                duration_minutes: s.duration_minutes,
              }}
              isEditable={false}
              isPublic
              businessSlug={businessSlug}
              manualBookingForCustomer={isOwnerManualBooking}
              bookingFlowLocale={bookingFlowLocale}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
