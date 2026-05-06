import { describe, expect, it } from 'vitest';
import {
  bcp47ForBookingLocale,
  PUBLIC_BOOKING_FLOW_BCP47,
  publicBookingUi,
  publicBookingUiFromUnknown,
  translatePublicBookingApiMessageForDisplay,
} from '@/libs/i18n/publicBookingUi';

describe('public booking UI catalogs', () => {
  it('publicBookingUi returns distinct Spanish copy for calendar strings', () => {
    const en = publicBookingUi('en');
    const es = publicBookingUi('es');
    expect(en.calendar.chooseTime).toBe('Choose time');
    expect(es.calendar.chooseTime).toBe('Elige la hora');
  });

  it('publicBookingUiFromUnknown falls back to English for invalid input', () => {
    const ui = publicBookingUiFromUnknown('xx');
    expect(ui.calendar.chooseTime).toBe('Choose time');
  });

  it('publicBookingUiFromUnknown accepts supported query values', () => {
    expect(publicBookingUiFromUnknown('es').nav.backToProfile).toBe(
      'Volver al perfil'
    );
  });

  it('translatePublicBookingApiMessageForDisplay leaves English unchanged on default locale', () => {
    expect(
      translatePublicBookingApiMessageForDisplay(
        'Could not start checkout.',
        'en'
      )
    ).toBe('Could not start checkout.');
  });

  it('translatePublicBookingApiMessageForDisplay maps known API strings in Spanish', () => {
    expect(
      translatePublicBookingApiMessageForDisplay(
        'Could not start checkout.',
        'es'
      )
    ).toBe(
      'No se pudo iniciar el pago. Vuelve a intentarlo o contacta al negocio.'
    );
  });

  it('bcp47ForBookingLocale matches registry', () => {
    expect(bcp47ForBookingLocale('en')).toBe(PUBLIC_BOOKING_FLOW_BCP47.en);
    expect(bcp47ForBookingLocale('es')).toBe(PUBLIC_BOOKING_FLOW_BCP47.es);
  });

  it('profile tab labels are localized', () => {
    expect(publicBookingUi('en').profile.servicesTab).toBe('Services');
    expect(publicBookingUi('es').profile.servicesTab).toBe('Servicios');
    expect(publicBookingUi('es').profile.galleryTab).toBe('Galería');
  });
});
