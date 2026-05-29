import type { PublicBookingUi } from '../catalogTypes';

export const publicBookingUiEs: PublicBookingUi = {
  nav: {
    backToDateTime: 'Volver a fecha y hora',
    backToDetails: 'Volver a los datos',
    backToReview: 'Volver a la revisión',
    backToProfile: 'Volver al perfil',
    backToService: 'Volver al servicio',
    backToOptions: 'Volver a las opciones',
    backToAddOns: 'Volver a complementos',
    backToServices: 'Volver a servicios',
    backToBookings: 'Volver a reservas',
  },
  common: {
    continue: 'Continuar',
    select: 'Seleccionar',
    summary: 'Resumen',
    total: 'Total',
    deposit: 'Depósito',
    depositPercentOfTotal: pct => `Depósito (${pct}% del total)`,
    dueNow: 'A pagar ahora',
    remaining: 'Restante',
    bookingTotal: 'Total de la reserva',
    service: 'Servicio',
    addOns: 'Complementos',
    date: 'Fecha',
    time: 'Hora',
    duration: 'Duración',
    vehicle: 'Vehículo',
    notes: 'Notas',
    contact: 'Contacto',
    address: 'Dirección',
    dateAndTime: 'Fecha y hora',
    emailNotProvided: 'Sin correo electrónico',
  },
  serviceDetails: {
    startingAt: 'Desde',
    chooseOption: 'Elige una opción',
    optionalAddOns: 'Complementos opcionales',
    dateAndTime: 'Fecha y hora',
    continue: 'Continuar',
    backToOptions: 'Volver a las opciones',
    backToProfile: 'Volver al perfil',
    backToServices: 'Volver a servicios',
  },
  bookPicker: {
    noServicesOwnerTitle: 'Aún no hay servicios para elegir.',
    noServicesPublicTitle: 'Aún no hay servicios.',
    noServicesOwnerBody:
      'Ve a Servicios en tu panel. Agrega un servicio y vuelve aquí.',
    noServicesPublicBody:
      'Los servicios aparecerán aquí cuando el negocio los agregue.',
    createAppointmentTitle: 'Crear nueva cita',
    bookWithTitle: name => `Reservar con ${name}`,
    createAppointmentSubtitle:
      'Estás creando una nueva cita. Elige un servicio abajo para continuar.',
    bookWithSubtitle:
      'Elige un servicio. Luego podrás agregar extras si los hay. Después elige fecha y hora.',
  },
  notAccepting: {
    title: 'Este negocio aún no acepta reservas.',
    body: 'Vuelve más tarde o contáctalos directamente.',
  },
  calendar: {
    chooseTime: 'Elige la hora',
    selectDateHint: 'Selecciona una fecha para ver los horarios disponibles.',
    noSlotsHint: 'No hay horarios disponibles para esta fecha.',
    reviewBooking: 'Revisa tu reserva',
    reviewBookingCta: 'Revisar reserva',
    notificationsConsentLabel:
      'Al confirmar esta cita, aceptas recibir notificaciones por correo y SMS sobre tu reserva.',
    notificationsSmsFinePrintBeforeLink:
      'Pueden aplicarse cargos por mensajes y datos. Responde STOP para darte de baja. Consulta nuestra ',
    notificationsSmsFinePrintLinkLabel: 'Política de privacidad conforme a SMS',
    notificationsSmsFinePrintAfterLink: '.',
    notificationsConsentRequired:
      'Marca la casilla para aceptar las notificaciones por correo y SMS antes de continuar.',
    continueToPayment: 'Continuar al pago',
    confirmBooking: 'Confirmar reserva',
    chooseHowToPay: 'Elige cómo pagar',
    paymentHeading: 'Pago',
    howDoYouWantToPay: '¿Cómo quieres pagar?',
    payWithCard: 'Pagar con tarjeta',
    payWithCardDescFull: 'Paga el total ahora con tarjeta.',
    payWithCardDescDeposit:
      'Paga el total ahora con tarjeta (incluye tu depósito).',
    payInPerson: 'Pagar en persona',
    payInPersonDescNoDeposit: 'Paga en persona en tu cita.',
    payInPersonDescDeposit:
      'Paga el depósito ahora para reservar. El resto lo pagas en persona en tu cita.',
    payInPersonNoteNoDeposit: 'Lleva el pago cuando veas a tu proveedor.',
    payInPersonNoteDeposit:
      'En el siguiente paso pagarás el depósito con tarjeta. El saldo restante lo pagas en persona cuando veas a tu proveedor.',
    payInAppNoteDeposit:
      'El monto a pagar ahora incluye tu depósito y confirma tu lugar.',
    payInAppNoteFull:
      'El total de la reserva se paga con tarjeta para confirmar tu lugar.',
    payNotSetupNote:
      'Puedes continuar; el pago con tarjeta estará disponible cuando el negocio termine de configurar pagos.',
    onlinePaymentUnavailable:
      'El pago en línea no está disponible para esta reserva.',
    invalidPaymentAmount:
      'El monto del pago no es válido. Actualiza la página e inténtalo de nuevo.',
    paymentFinalizeWait:
      'Recibimos el pago, pero aún estamos confirmando tu reserva. Actualiza en un momento.',
    stripeLeaveNotice:
      'Saldrás de esta página para pagar de forma segura con Stripe.',
    confirmingPaymentAria: 'Confirmando pago',
    confirmingPaymentText: 'Confirmando tu pago…',
    goingToCheckout: 'Abriendo el pago',
    confirmingBooking: 'Confirmando reserva',
    payAmount: amount => `Pagar ${amount}`,
    payDepositAmount: amount => `Pagar depósito de ${amount}`,
    depositPercentLead: (businessName, pct) =>
      `${businessName} exige un depósito del ${pct}% del costo total para reservar esta cita. Este depósito no es reembolsable.`,
    depositFixedLead: (businessName, amount) =>
      `${businessName} exige un depósito de ${amount} para reservar esta cita. Este depósito no es reembolsable.`,
    payInFullLead: businessName =>
      `${businessName} solicita pagar el total con tarjeta para confirmar esta reserva.`,
    payInPersonLead: businessName =>
      `${businessName} cobra en persona cuando se encuentren; aquí no se carga nada hoy.`,
    paymentNotSetupLead: businessName =>
      `Las opciones de pago de ${businessName} aún no están listas. Hoy no se te cobrará aquí.`,
  },
  customerForm: {
    yourDetails: 'Tus datos',
    serviceAddress: 'Dirección del servicio',
    vehicle: 'Vehículo',
    fullName: 'Nombre completo',
    email: 'Correo electrónico',
    phone: 'Teléfono',
    streetAddress: 'Calle y número',
    unitApt: 'Depto. / apto. (opcional)',
    city: 'Ciudad',
    state: 'Estado',
    zip: 'Código postal',
    year: 'Año',
    make: 'Marca',
    model: 'Modelo',
    notesOptional: 'Notas (opcional)',
    notesPlaceholder: 'Indicaciones de acceso o peticiones especiales…',
    errFullName: 'El nombre completo es obligatorio',
    errEmail: 'El correo electrónico es obligatorio',
    errPhone: 'El teléfono es obligatorio',
    errStreet: 'La dirección es obligatoria',
    errCity: 'La ciudad es obligatoria',
    errState: 'El estado es obligatorio',
    errZip: 'El código postal es obligatorio',
    errZipInvalid:
      'Introduce un código postal válido de EE. UU. (5 dígitos o 9 con ZIP+4)',
    errVehicleYear: 'El año del vehículo es obligatorio',
    errVehicleYearInvalid: 'Introduce un año válido de 4 dígitos',
    errVehicleMake: 'La marca del vehículo es obligatoria',
    errVehicleModel: 'El modelo del vehículo es obligatorio',
    emailOptional: 'Correo electrónico (opcional)',
    emailOptionalNoConfirmation:
      'Sin dirección de correo, no se enviará un correo de confirmación de la reserva.',
    errEmailInvalid: 'Introduce una dirección de correo válida',
    errValueTooLong: 'Este valor es demasiado largo',
  },
  bookingSuccess: {
    title: 'Reserva confirmada',
    subtitleOwner:
      'Se creó la cita. Tu cliente recibirá un correo de notificación.',
    subtitleOwnerNoCustomerEmail:
      'Se creó la cita. No se envió correo de confirmación porque no indicaste el correo del cliente.',
    subtitleCustomer: businessName =>
      `Tu cita con ${businessName} está confirmada. ¡Nos vemos!`,
    subtitleCustomerNoEmail: businessName =>
      `Tu cita con ${businessName} está confirmada. No se envió correo de confirmación porque no indicaste una dirección de correo.`,
    cardHeaderOwner: 'Cita',
    cardHeaderCustomer: 'Tu reserva',
    ownerPaymentNote: 'Los datos de pago quedan guardados con esta cita.',
    customerPaymentNote:
      'Los detalles de pago aparecerán en tu confirmación de reserva.',
    goToBookings: 'Ir a reservas',
    backToProfile: 'Volver al perfil',
  },
  bookingPaymentSuccess: {
    paidFullTitle: 'Pago recibido',
    depositTitle: 'Depósito recibido',
    heroPaidFull: businessName =>
      `Tu cita con ${businessName} está confirmada y pagada por completo a través de ServiceLink.`,
    heroDeposit: businessName =>
      `Tu cita con ${businessName} está confirmada. Recibimos tu depósito por ServiceLink; el resto lo acordarás con tu proveedor.`,
    cardHeader: 'Tu reserva',
    serviceLinkPayment: 'Pago ServiceLink',
    paidNow: 'Pagado ahora',
    remaining: 'Restante',
    confirmationNote:
      'Enviamos un correo de confirmación con estos datos. Si pagaste con tarjeta, Stripe puede enviar un recibo.',
    backToProfile: 'Volver al perfil',
  },
  serviceCard: {
    startingAt: 'Desde',
    seeMore: 'Ver más',
    seeLess: 'Ver menos',
    contactForQuote: 'Solicitar cotización',
  },
  profile: {
    requestQuote: 'Solicitar cotización',
    contactPhoneCta: 'Llamar',
    quotePageSubtitle: businessName =>
      `Comparte algunos datos y ${businessName} te enviará una cotización.`,
    servicesTab: 'Servicios',
    galleryTab: 'Galería',
    bioTab: 'Biografía',
    reviewsTab: 'Reseñas',
    noBioYet: 'Aún no hay biografía.',
    notTakingBookingsRightNow:
      'No aceptan reservas por ServiceLink en este momento.',
    reviewCountLabel: count => (count === 1 ? '1 reseña' : `${count} reseñas`),
    ratingAriaLabel: average => `${average} de 5 estrellas`,
    reviewsSectionTitle: 'Reseñas de clientes',
    ownerReplyLabel: 'Respuesta del negocio',
    reviewsShowingSample: 'Mostrando reseñas recientes',
  },
};
