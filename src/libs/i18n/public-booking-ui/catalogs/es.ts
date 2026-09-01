import type { PublicBookingUi } from '../catalogTypes';

export const publicBookingUiEs: PublicBookingUi = {
  nav: {
    backToDateTime: 'Volver a fecha y hora',
    backToYourDetails: 'Volver a tu información',
    backToCustomerDetails: 'Volver a la información del cliente',
    backToAddress: 'Volver a la dirección',
    backToVehicle: 'Volver al vehículo',
    backToDetails: 'Volver a los datos',
    backToReview: 'Volver a la revisión',
    backToProfile: 'Volver al perfil',
    backToService: 'Volver al servicio',
    backToOptions: 'Volver a las opciones',
    backToAddOns: 'Volver a complementos',
    backToServices: 'Volver a servicios',
    backToBookings: 'Volver a reservas',
    backToAppointmentType: 'Volver al tipo de cita',
  },
  common: {
    back: 'Volver',
    continue: 'Continuar',
    close: 'Cerrar',
    select: 'Seleccionar',
    summary: 'Resumen',
    total: 'Total',
    deposit: 'Depósito',
    depositPercentOfTotal: pct => `Depósito (${pct}% del total)`,
    dueNow: 'A pagar ahora',
    remaining: 'Restante',
    bookingTotal: 'Total de la reserva',
    youSave: amount => `Ahorras ${amount}`,
    service: 'Servicio',
    addOns: 'Complementos',
    date: 'Fecha',
    time: 'Hora',
    duration: 'Duración',
    vehicle: 'Vehículo',
    pet: 'Mascota',
    notes: 'Notas',
    contact: 'Contacto',
    address: 'Dirección',
    dateAndTime: 'Fecha y hora',
    schedule: 'Horario',
    customer: 'Cliente',
    subtotal: 'Subtotal',
    visitTotal: 'Total de la visita',
    emailNotProvided: 'Sin correo electrónico',
  },
  serviceDetails: {
    startingAt: 'Desde',
    choosePricingOption: 'Elige una opción de precio',
    optionalAddOns: 'Complementos opcionales',
    dateAndTime: 'Fecha y hora',
    continue: 'Continuar',
    backToOptions: 'Volver a las opciones',
    backToProfile: 'Volver al perfil',
    backToServices: 'Volver a servicios',
    seeDescription: 'Ver descripción',
    hideDescription: 'Ocultar descripción',
  },
  stepTracker: {
    service: 'Servicio',
    time: 'Hora',
    details: 'Detalles',
    confirm: 'Confirmar',
  },
  quickSchedule: {
    nextAvailableLabel: 'Próximo disponible',
    bookThisTime: 'Reservar esta hora',
    chooseDifferentTime: 'Elegir otra hora',
    backToFirstAvailable: 'Volver a la primera disponible',
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
      'Elige un servicio abajo y continúa. Puedes agregar más servicios después.',
    chooseAppointmentTypeSubtitle:
      'Elige un servicio guardado o crea un trabajo personalizado.',
    appointmentTypeAriaLabel: 'Cómo establecer el servicio',
    fromServicesTitle: 'De tus servicios',
    fromServicesDescription: 'Elige un servicio de tu lista.',
    customJobTitle: 'Trabajo personalizado',
    customJobSubtitle:
      'Crea una cita que no esté conectada a un servicio guardado.',
    customJobRowDescription:
      'Úsalo para trabajos únicos o servicios que no están en tu lista.',
    customJobNameLabel: 'Nombre del trabajo',
    customJobNamePlaceholder: 'p. ej. Limpieza de ventanas',
    customJobPriceLabel: 'Precio',
    customJobPricePlaceholder: 'p. ej. $100',
    customJobDurationLabel: 'Duración',
    customJobDurationPlaceholder: 'Selecciona la duración',
    customJobNotesLabel: 'Notas (opcional)',
    customJobNotesPlaceholder:
      'Agrega detalles o contexto sobre este trabajo personalizado.',
    addingToBookingSubtitle: count =>
      count === 1
        ? 'Genial — ya tienes 1 servicio. Elige otro abajo para agregarlo.'
        : `Genial — ya tienes ${count} servicios. Elige otro abajo para agregarlo.`,
    yourBookingTitle: count =>
      count === 1
        ? '1 servicio ya en tu reserva'
        : `${count} servicios ya en tu reserva`,
    addingAnotherHint: 'Selecciona un servicio abajo y continúa.',
    cancelAddService: 'Volver a tu reserva',
    continueToSchedule: 'Continuar',
    seeDescription: 'Ver descripción',
    hideDescription: 'Ocultar descripción',
    unfinishedBookingTitle: '¿Continuar donde lo dejaste?',
    unfinishedBookingBody: count =>
      count === 1
        ? 'Todavía tienes 1 servicio guardado en este navegador. Continúa esa reserva o empieza de nuevo.'
        : `Todavía tienes ${count} servicios guardados en este navegador. Continúa esa reserva o empieza de nuevo.`,
    continueUnfinishedBooking: 'Continuar reserva',
    startOverBooking: 'Empezar de nuevo',
  },
  multiJob: {
    yourServices: 'Servicios en esta reserva',
    jobLabel: n => `Servicio ${n}`,
    remove: 'Quitar',
    addAnotherService: 'Agregar otro servicio',
    addAnotherVehicle: 'Agregar otro vehículo',
    visitSummary: count => `${count} servicios`,
    vehiclePerService: 'Vehículo para cada servicio',
    petPerService: 'Mascota para cada servicio',
    maxJobsReached: 'Puedes agregar hasta 4 servicios en una reserva.',
    vehicleRequiredToast:
      'Agrega año, marca y modelo de cada servicio antes de continuar.',
    vehicleRequiredToastForJob: name =>
      `Agrega año, marca y modelo de ${name} antes de continuar.`,
    petRequiredToast:
      'Agrega nombre, especie, raza y tamaño de cada mascota antes de continuar.',
    petRequiredToastForJob: name =>
      `Agrega los datos de la mascota para ${name} antes de continuar.`,
    maxJobsReachedToast:
      'Ya tienes 4 servicios en esta reserva. Quita uno para agregar otro.',
    couldNotAddServiceToast:
      'No se pudo agregar ese servicio. Vuelve e inténtalo de nuevo.',
    retimingRequired:
      'Tu reserva es más larga ahora. Elige una hora de inicio que cubra toda la visita.',
  },
  notAccepting: {
    title: 'Este negocio aún no acepta reservas.',
    body: 'Vuelve más tarde o contáctalos directamente.',
    ownerFreeCapTitle: 'Alcanzaste el límite de tu plan gratuito',
    ownerFreeCapBody: limit =>
      `Usaste las ${limit} citas gratuitas. Actualiza a Pro para crear más reservas.`,
    ownerBookingsOffTitle: 'No estás aceptando reservas ahora',
    ownerBookingsOffBody:
      'Activa Aceptar reservas en Disponibilidad y vuelve a intentar crear una cita.',
    ownerBackToBookings: 'Volver a reservas',
    ownerUpgradeCta: 'Actualizar a Pro',
  },
  calendar: {
    chooseTime: 'Elige la hora',
    selectDateHint: 'Selecciona una fecha para ver los horarios disponibles.',
    noSlotsHint: 'No hay horarios disponibles para esta fecha.',
    reviewBooking: 'Revisa tu reserva',
    reviewBookingCta: 'Revisar reserva',
    notificationsConsentCheckboxLabel:
      'Enviarme actualizaciones de la cita por mensaje',
    notificationsConsentFinePrint: (businessName: string) =>
      `De ${businessName}. La frecuencia de mensajes puede variar. Pueden aplicarse tarifas de mensajes y datos. Responde STOP para darte de baja, HELP para ayuda. Consulta nuestra`,
    notificationsSmsFinePrintLinkLabel: 'Política de Privacidad',
    notificationsSmsTermsLinkLabel: 'Términos de Servicio',
    policyHeading: 'Política de reserva',
    policyConsentCheckboxLabel: 'Acepto la política de reserva',
    policyReviewLead: 'Acepto la',
    policyLinkLabel: 'política de reserva',
    policyConsentRequired:
      'Debes aceptar la política de reserva para continuar.',
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
    saleApplies: (saleName, discountLabel) =>
      `${saleName} — ${discountLabel} aplica`,
    promoCodeHeading: 'Código promocional',
    promoCodePlaceholder: 'Ingresa el código',
    promoCodeApply: 'Aplicar',
    promoCodeApplying: 'Aplicando…',
    promoCodeRemove: 'Quitar',
    promoCodeApplied: code => `Código ${code} aplicado`,
    promoCodeInvalid: 'Ese código promocional no es válido.',
    promoCodeInactive: 'Ese código promocional ya no está activo.',
    promoCodeScheduled: 'Ese código promocional aún no está disponible.',
    promoCodeExpired: 'Ese código promocional ha vencido.',
    promoCodeAlreadyUsed: 'Ya usaste este código promocional.',
    promoCodeIdentityRequired:
      'Agrega un teléfono o correo para usar este código.',
    promoCodeUnavailable:
      'Los códigos promocionales no están disponibles para este negocio.',
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
  serviceLocation: {
    chooseHeading: '¿Dónde será el servicio?',
    chooseSubtitle: 'Elige si van a tu ubicación o tú visitas su local.',
    mobileOption: 'En mi dirección',
    mobileOptionDesc: 'Ellos van a ti. Ingresarás tu dirección.',
    shopOption: 'En su local',
    shopOptionDesc: 'Tú visitas su ubicación a la hora reservada.',
    shopVisitAddressLabel: 'Dirección del local',
    shopAddressIncomplete:
      'Este negocio aún no ha configurado la dirección de su local.',
    backToServiceChoice: 'Volver a tipo de ubicación',
    backToShopLocation: 'Volver al local',
    ownerChooseHeading: '¿Dónde será el servicio?',
    ownerChooseSubtitle: 'Elige móvil o local para esta cita.',
    ownerMobileOption: 'Móvil',
    ownerMobileOptionDesc: 'Tú vas al cliente. Ingresarás su dirección.',
    ownerShopOption: 'Local',
    ownerShopOptionDesc:
      'El cliente visita tu local. No necesitas ingresar dirección.',
  },
  customerForm: {
    yourDetails: 'Tu información',
    customerDetails: 'Información del cliente',
    serviceAddress: 'Dirección del servicio',
    vehicle: 'Vehículo',
    optionalVehicleDetails: 'Opcional — agrega los datos del vehículo.',
    pet: 'Mascota',
    optionalPetDetails: 'Opcional — agrega los datos de la mascota.',
    petName: 'Nombre de la mascota',
    petNamePlaceholder: 'Buddy',
    petSpecies: 'Especie',
    petSpeciesPlaceholder: 'Selecciona especie',
    petBreed: 'Raza',
    petBreedPlaceholder: 'Golden Retriever',
    petSize: 'Tamaño',
    petSizePlaceholder: 'Selecciona tamaño',
    speciesDog: 'Perro',
    speciesCat: 'Gato',
    sizeSmall: 'Pequeño',
    sizeMedium: 'Mediano',
    sizeLarge: 'Grande',
    sizeXl: 'Extra grande',
    errPetName: 'El nombre de la mascota es obligatorio',
    errPetSpecies: 'La especie es obligatoria',
    errPetBreed: 'La raza es obligatoria',
    errPetSize: 'El tamaño es obligatorio',
    savedVehiclesTitle: 'Tus vehículos guardados',
    savedVehiclesLoading: 'Buscando tus vehículos…',
    savedVehiclesHint: 'Toca uno para completar año, marca y modelo.',
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
    errZipInvalid: 'Introduce un código postal válido de 5 dígitos (EE. UU.)',
    errVehicleYear: 'El año del vehículo es obligatorio',
    errVehicleYearInvalid: 'Introduce un año válido de 4 dígitos',
    errVehicleMake: 'La marca del vehículo es obligatoria',
    errVehicleModel: 'El modelo del vehículo es obligatorio',
    emailOptional: 'Correo electrónico (opcional)',
    noEmailConfirmationNotice:
      'Sin correo electrónico, no se enviará una confirmación.',
    smsComingSoon: 'Mensajes SMS próximamente.',
    errEmailInvalid: 'Introduce una dirección de correo válida',
    errValueTooLong: 'Este valor es demasiado largo',
  },
  bookingSuccess: {
    title: 'Reserva confirmada',
    titleOwner: 'Cita creada',
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
  subscriptions: {
    subscriptionsTab: 'Suscripciones',
    subscribeCta: 'Suscribirse',
    popularBadge: 'Popular',
    contactForPrice: 'Consultar precio',
    cadencePickerLabel: '¿Cada cuánto?',
    cadencePickerAriaLabel: 'Elige la frecuencia',
    detailsModalTitle: 'Tu plan',
    closeDetailsAriaLabel: 'Cerrar',
    howItWorksTitle: 'Cómo funciona',
    howItWorksSteps: [
      {
        title: 'Te suscribes',
        body: 'Entras al plan con la frecuencia que elegiste.',
      },
      {
        title: 'Se cobra automáticamente',
        body: 'Te cobramos en esa frecuencia. Tu proveedor recibe el pago — sin facturas raras.',
      },
      {
        title: 'Tú eliges cada visita',
        body: 'En cada período eliges día y hora. Sin visitas sorpresa.',
      },
      {
        title: 'Ellos llegan y hacen el trabajo',
        body: 'Tu proveedor viene, lo deja listo, y hasta la próxima. Así de simple.',
      },
    ],
    howItWorksContinueCta: 'Continuar',
    contactTitle: 'Datos de contacto',
    contactHint: 'Agrega tus datos.',
    contactContinueCta: 'Continuar',
    contactIncomplete:
      'Ingresa tu nombre, un correo válido y un teléfono de 10 dígitos.',
    serviceDetailsTitle: 'Detalles del servicio',
    serviceDetailsHint: 'Confirma tu dirección y vehículo para esta visita.',
    serviceDetailsContinueCta: 'Continuar',
    serviceDetailsIncomplete:
      'Completa los campos obligatorios de dirección y vehículo.',
    usingSavedDetails:
      'Lo llenamos con tu última visita — cambia lo que no esté bien.',
    vehicleLockedNote:
      'Esta membresía es para este vehículo. Contacta al negocio si necesitas cambiarlo.',
    vehicleLockedEmpty:
      'No hay un vehículo registrado. Contacta al negocio si esto no se ve bien.',
    firstVisitTitle: 'Elige tu primera visita',
    firstVisitHint: '',
    firstVisitRequired: 'Elige una fecha para tu primera visita.',
    firstVisitTimeTitle: 'Elige una hora',
    firstVisitTimeRequired: 'Elige una hora para tu visita.',
    firstVisitNoSlots: 'No hay horarios este día. Prueba otra fecha.',
    subscribePageBackLabel: 'Suscripciones',
    subscribeStepBackLabel: 'Atrás',
    continueToCheckoutCta: 'Continuar al pago',
    checkoutComingSoon: 'El pago estará disponible pronto.',
    checkoutStartFailed: 'No se pudo iniciar el pago. Inténtalo de nuevo.',
    alreadySubscribed:
      'Ya tienes una suscripción. Administra tu plan si necesitas hacer cambios.',
    checkoutReturnSuccess: 'Pago recibido — gracias por suscribirte.',
    checkoutReturnCancel:
      'Pago cancelado. Puedes intentarlo de nuevo cuando quieras.',
    successTitle: 'Ya estás suscrito',
    successSubtitle:
      'Todo listo. Enviaremos el recibo al correo que usaste al pagar.',
    successSubtitleWithBusiness: businessName =>
      `Todo listo con ${businessName}. Enviaremos el recibo al correo que usaste al pagar.`,
    successDoneCta: 'Listo',
    manageLinkCta: '¿Ya estás suscrito? Administra tu plan',
    manageModalTitle: 'Administra tu plan',
    manageModalDescription:
      'Ingresa el correo que usaste al pagar. Si encontramos una suscripción, te enviaremos un enlace para administrarla o cancelarla.',
    manageEmailLabel: 'Correo',
    manageEmailPlaceholder: 'tu@email.com',
    manageSendLinkCta: 'Envíame un enlace',
    manageEmailRequired: 'Ingresa el correo que usaste al pagar.',
    manageSendSuccess:
      'Si encontramos una suscripción para ese correo, te enviaremos un enlace en breve.',
    manageSendFailed: 'No se pudo enviar el enlace ahora. Inténtalo de nuevo.',
    manageRateLimited:
      'Demasiados intentos. Vuelve a intentarlo en unos minutos.',
    periodVisitTitle: 'Elige tu próxima visita',
    periodVisitDetailsHint: 'Confirma la dirección para esta visita.',
    periodVisitDetailsHintShop: 'Confirma tus datos y luego elige una fecha.',
    periodVisitUsingSavedDetails:
      'Lo llenamos con tu última visita — puedes actualizar la dirección.',
    periodVisitAddressIncomplete:
      'Completa los campos obligatorios de dirección.',
    periodVisitHint: planName => `Elige fecha y hora para ${planName}.`,
    periodVisitTimeTitle: 'Elige una hora',
    periodVisitDateRequired: 'Elige una fecha para tu visita.',
    periodVisitDateOutOfPeriod:
      'Esa fecha ya corresponde a un período usado. Elige una fecha posterior.',
    periodVisitCalendarSubtitle:
      'Esta visita es para tu próximo período — las fechas anteriores no están disponibles.',
    periodVisitTimeRequired: 'Elige una hora para tu visita.',
    periodVisitNoSlots: 'No hay horarios este día. Prueba otra fecha.',
    periodVisitConfirmCta: 'Reservar visita',
    periodVisitBookFailed:
      'No se pudo reservar esa visita. Inténtalo de nuevo.',
    periodVisitBookSuccess: 'Tu visita está reservada.',
    periodVisitScheduledTitle: 'Visita programada',
    periodVisitScheduledBody: (planName, when) =>
      when
        ? `${planName} quedó para ${when}. Te enviaremos confirmación por correo o SMS cuando esté disponible.`
        : `${planName} quedó reservada. Te enviaremos confirmación por correo o SMS cuando esté disponible.`,
    periodVisitCompletedTitle: 'Visita completada',
    periodVisitCompletedBody: (planName, when) =>
      when
        ? `${planName} de este período ya está hecho (${when}). La siguiente visita se abre cuando empiece el próximo período de facturación.`
        : `${planName} de este período ya está hecho. La siguiente visita se abre cuando empiece el próximo período de facturación.`,
    periodVisitInactiveTitle: 'Membresía no activa',
    periodVisitInactiveBody:
      'Esta membresía no puede reservar una visita ahora. Contacta al negocio si necesitas ayuda.',
    cadenceSuffix: {
      week: '/sem',
      weeks: count => `/${count}sem`,
      month: '/mes',
      months: count => `/${count}mes`,
      year: '/año',
      years: count => `/${count}años`,
    },
    cadenceLabel: {
      weekly: 'Semanal',
      everyWeeks: count => `Cada ${count} semanas`,
      monthly: 'Mensual',
      everyMonths: count =>
        count === 3 ? 'Cada 3 meses' : `Cada ${count} meses`,
      yearly: 'Anual',
      everyYears: count => `Cada ${count} años`,
    },
  },
  profile: {
    requestQuote: 'Solicitar cotización',
    contactPhoneCta: 'Llamar',
    quotePageSubtitle: businessName =>
      `Dile a ${businessName} qué necesitas. Te enviarán un precio.`,
    servicesTab: 'Servicios',
    galleryTab: 'Galería',
    galleryEmptyTitle: 'Aún no hay fotos',
    galleryEmptyDescription:
      'Este negocio aún no ha compartido fotos en la galería.',
    workPhotoAlt: (businessName, index, total) =>
      `Foto de trabajo de ${businessName} ${index} de ${total}`,
    lightboxClose: 'Cerrar',
    lightboxPrevious: 'Foto anterior',
    lightboxNext: 'Foto siguiente',
    lightboxPhotoPosition: (current, total) => `${current} de ${total}`,
    bioTab: 'Biografía',
    reviewsTab: 'Reseñas',
    noBioYet: 'Aún no hay biografía.',
    specialtiesAriaLabel: 'Especialidades',
    bookingPolicyLabel: 'Política de reserva',
    viewBookingPolicy: businessName => `Política de reserva de ${businessName}`,
    notTakingBookingsRightNow:
      'No aceptan reservas por ServiceLink en este momento.',
    reviewCountLabel: count => (count === 1 ? '1 reseña' : `${count} reseñas`),
    ratingAriaLabel: average => `${average} de 5 estrellas`,
    reviewsSectionTitle: 'Reseñas de clientes',
    reviewsShowingSample: 'Mostrando reseñas recientes',
    reviewsLoadError: 'No se pudieron cargar las reseñas. Vuelve a intentarlo.',
    reviewsRetry: 'Reintentar',
    reviewsLoadingAriaLabel: 'Cargando reseñas',
    serviceCategoryOther: 'Otros servicios',
    serviceCategoriesAriaLabel: 'Ver servicios por categoría',
    noServicesInCategory: 'No hay servicios en esta categoría.',
    saleBannerBadge: 'Oferta',
    saleBannerOffLabel: 'dto',
    saleBannerWhenYouBook: discount => `Obtén ${discount} al reservar`,
    saleBannerLimitedTime: 'Por tiempo limitado',
    saleBannerDates: {
      validPrefix: 'Oferta válida',
      throughPrefix: 'Oferta hasta',
      dateRange: (start, end) => `${start} – ${end}`,
      through: date => `Oferta hasta ${date}`,
      fromThrough: (start, end) => `Oferta válida ${start} – ${end}`,
    },
    saleBannerAriaLabel: (saleName, discount) =>
      `Oferta activa: ${saleName}, ${discount}`,
    saleMarqueeAnnouncement: (saleName, discountMain, offLabel) =>
      `${saleName}, ${discountMain} ${offLabel}`,
  },
  quoteForm: {
    quoteDetails: 'Tu solicitud',
    whenOptional: '¿Cuándo? (opcional)',
    whenLabel: '¿Cuándo?',
    whenPlaceholder: 'Selecciona plazo',
    detailsLabel: 'Describe el trabajo',
    successDetailsLabel: 'Solicitud',
    detailsPlaceholder:
      'Café en los asientos — no está tan mal, solo quiero que los laven.',
    addAnotherVehicle: 'Agregar otro vehículo',
    secondVehicle: 'Segundo vehículo',
    removeVehicle: 'Quitar',
    reviewTitle: 'Revisa tu solicitud',
    reviewSubtitle: 'Asegúrate de que todo esté bien antes de enviarla.',
    reviewRequest: 'Revisar solicitud',
    backToRequest: 'Volver a tu solicitud',
    edit: 'Editar',
    submitRequest: 'Enviar solicitud',
    successTitle: 'Solicitud enviada',
    successSubtitle: (businessName: string) =>
      `${businessName} tiene tu solicitud. Te contactarán por correo o teléfono.`,
    successCardHeader: 'Tu solicitud',
    successBack: 'Volver al perfil',
    timelineAsap: 'Lo antes posible',
    timelineThisWeek: 'Esta semana',
    timelineNextTwoWeeks: 'Próximas 2 semanas',
    timelineThisMonth: 'Este mes',
    timelineFlexible: 'Flexible',
    errName: 'El nombre es obligatorio',
    errEmail: 'Introduce un correo válido',
    errPhone: 'El teléfono debe tener 10 dígitos',
    errDetails: 'Añade un mensaje corto',
    errVehicleYear: 'Introduce un año válido de 4 dígitos',
    errVehicleMake: 'La marca del vehículo es obligatoria',
    errVehicleModel: 'El modelo del vehículo es obligatorio',
    submitErrorGeneric: 'Algo salió mal. Vuelve a intentarlo.',
  },
};
