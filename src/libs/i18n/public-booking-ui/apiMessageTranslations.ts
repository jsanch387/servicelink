import {
  DEFAULT_PUBLIC_BOOKING_FLOW_LOCALE,
  type PublicBookingFlowLocale,
} from '@/constants/routes';

/**
 * API responses (and a few client-only strings) are authored in English.
 * Map English → localized copy per locale. Add a `fr: { ... }` entry when you ship French.
 */
const API_MESSAGE_OVERRIDES: Partial<
  Record<PublicBookingFlowLocale, Record<string, string>>
> = {
  es: {
    'Could not start checkout.':
      'No se pudo iniciar el pago. Vuelve a intentarlo o contacta al negocio.',
    'Something went wrong. Please try again.':
      'Algo salió mal. Por favor, inténtalo de nuevo.',
    'That time is not available. Please choose another slot.':
      'Ese horario ya no está disponible. Elige otro.',
    'Business slug is required': 'Falta el identificador del negocio.',
    'Service name is required': 'El nombre del servicio es obligatorio.',
    'Valid scheduled date (YYYY-MM-DD) is required':
      'La fecha programada debe ser válida (AAAA-MM-DD).',
    'Valid start time (HH:mm) is required':
      'La hora de inicio debe ser válida (HH:mm).',
    'Duration is required': 'La duración es obligatoria.',
    'Customer name is required': 'El nombre completo es obligatorio.',
    'Customer email is required': 'El correo electrónico es obligatorio.',
    'Business not found': 'No encontramos este negocio.',
    "This business isn't accepting new bookings right now. They've reached the limit for their current plan.":
      'Este negocio no acepta nuevas reservas en este momento; alcanzó el límite de su plan actual.',
    'Online payment is not available for this booking.':
      'El pago en línea no está disponible para esta reserva.',
    'Invalid payment amount. Please refresh and try again.':
      'El monto del pago no es válido. Actualiza la página e inténtalo de nuevo.',
    'Payment received, but we are still finalizing your booking. Please refresh in a moment.':
      'Recibimos el pago, pero aún estamos confirmando tu reserva. Actualiza en un momento.',
  },
};

export function translatePublicBookingApiMessageForDisplay(
  message: string,
  locale: PublicBookingFlowLocale
): string {
  if (locale === DEFAULT_PUBLIC_BOOKING_FLOW_LOCALE) return message;
  return API_MESSAGE_OVERRIDES[locale]?.[message] ?? message;
}
