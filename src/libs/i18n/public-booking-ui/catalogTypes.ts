/**
 * Shape of all public booking / profile funnel UI strings (not owner-authored content).
 * Add a locale by implementing this type in `catalogs/<code>.ts` and registering it in `catalogs/registry.ts`.
 */
export type PublicBookingUi = {
  nav: {
    backToDateTime: string;
    backToDetails: string;
    backToReview: string;
    backToProfile: string;
    backToService: string;
    backToOptions: string;
    backToAddOns: string;
    backToServices: string;
    backToBookings: string;
  };
  common: {
    continue: string;
    select: string;
    summary: string;
    total: string;
    deposit: string;
    depositPercentOfTotal: (pct: number) => string;
    dueNow: string;
    remaining: string;
    bookingTotal: string;
    service: string;
    addOns: string;
    date: string;
    time: string;
    duration: string;
    vehicle: string;
    notes: string;
    contact: string;
    address: string;
    dateAndTime: string;
    /** Summary row when customer email was left blank */
    emailNotProvided: string;
  };
  serviceDetails: {
    startingAt: string;
    chooseOption: string;
    optionalAddOns: string;
    dateAndTime: string;
    continue: string;
    backToOptions: string;
    backToProfile: string;
    backToServices: string;
  };
  bookPicker: {
    noServicesOwnerTitle: string;
    noServicesPublicTitle: string;
    noServicesOwnerBody: string;
    noServicesPublicBody: string;
    createAppointmentTitle: string;
    bookWithTitle: (businessName: string) => string;
    createAppointmentSubtitle: string;
    bookWithSubtitle: string;
  };
  notAccepting: {
    title: string;
    body: string;
  };
  calendar: {
    chooseTime: string;
    selectDateHint: string;
    noSlotsHint: string;
    reviewBooking: string;
    reviewBookingCta: string;
    /** Public booking: required consent for transactional email + SMS (e.g. Twilio). */
    notificationsConsentLabel: string;
    /** Fine print under consent; shown before the privacy policy link label. */
    notificationsSmsFinePrintBeforeLink: string;
    /** Linked text to `/privacy` (SMS-related section). */
    notificationsSmsFinePrintLinkLabel: string;
    /** Text after the privacy policy link (often a period). */
    notificationsSmsFinePrintAfterLink: string;
    notificationsConsentRequired: string;
    continueToPayment: string;
    confirmBooking: string;
    chooseHowToPay: string;
    paymentHeading: string;
    howDoYouWantToPay: string;
    payWithCard: string;
    payWithCardDescFull: string;
    payWithCardDescDeposit: string;
    payInPerson: string;
    payInPersonDescNoDeposit: string;
    payInPersonDescDeposit: string;
    payInPersonNoteNoDeposit: string;
    payInPersonNoteDeposit: string;
    payInAppNoteDeposit: string;
    payInAppNoteFull: string;
    payNotSetupNote: string;
    stripeLeaveNotice: string;
    confirmingPaymentAria: string;
    confirmingPaymentText: string;
    onlinePaymentUnavailable: string;
    invalidPaymentAmount: string;
    paymentFinalizeWait: string;
    goingToCheckout: string;
    confirmingBooking: string;
    payAmount: (amount: string) => string;
    payDepositAmount: (amount: string) => string;
    depositPercentLead: (businessName: string, pct: number) => string;
    depositFixedLead: (businessName: string, amount: string) => string;
    payInFullLead: (businessName: string) => string;
    payInPersonLead: (businessName: string) => string;
    paymentNotSetupLead: (businessName: string) => string;
  };
  customerForm: {
    yourDetails: string;
    serviceAddress: string;
    vehicle: string;
    fullName: string;
    email: string;
    phone: string;
    streetAddress: string;
    unitApt: string;
    city: string;
    state: string;
    zip: string;
    year: string;
    make: string;
    model: string;
    notesOptional: string;
    notesPlaceholder: string;
    errFullName: string;
    errEmail: string;
    errPhone: string;
    errStreet: string;
    errCity: string;
    errState: string;
    errZip: string;
    errZipInvalid: string;
    errVehicleYear: string;
    errVehicleYearInvalid: string;
    errVehicleMake: string;
    errVehicleModel: string;
    /** Label when owner books without requiring customer email */
    emailOptional: string;
    /** Hint under email when optional and field empty */
    emailOptionalNoConfirmation: string;
    errEmailInvalid: string;
    errValueTooLong: string;
  };
  bookingSuccess: {
    title: string;
    subtitleOwner: string;
    /** Owner booked successfully but customer had no email (no confirmation sent) */
    subtitleOwnerNoCustomerEmail: string;
    subtitleCustomer: (businessName: string) => string;
    /** Public booking confirmed without customer email (no confirmation sent) */
    subtitleCustomerNoEmail: (businessName: string) => string;
    cardHeaderOwner: string;
    cardHeaderCustomer: string;
    ownerPaymentNote: string;
    customerPaymentNote: string;
    goToBookings: string;
    backToProfile: string;
  };
  bookingPaymentSuccess: {
    paidFullTitle: string;
    depositTitle: string;
    heroPaidFull: (businessName: string) => string;
    heroDeposit: (businessName: string) => string;
    cardHeader: string;
    serviceLinkPayment: string;
    paidNow: string;
    remaining: string;
    confirmationNote: string;
    backToProfile: string;
  };
  serviceCard: {
    startingAt: string;
    seeMore: string;
    seeLess: string;
    contactForQuote: string;
  };
  profile: {
    requestQuote: string;
    contactPhoneCta: string;
    quotePageSubtitle: (businessName: string) => string;
    /** Public profile preview tabs (same view as embedded “back to profile” from booking). */
    servicesTab: string;
    galleryTab: string;
    bioTab: string;
    noBioYet: string;
  };
};
