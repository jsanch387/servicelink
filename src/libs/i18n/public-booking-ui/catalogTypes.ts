/**
 * Shape of all public booking / profile funnel UI strings (not owner-authored content).
 * Add a locale by implementing this type in `catalogs/<code>.ts` and registering it in `catalogs/registry.ts`.
 */
export type PublicBookingUi = {
  nav: {
    backToDateTime: string;
    backToYourDetails: string;
    backToCustomerDetails: string;
    backToAddress: string;
    backToVehicle: string;
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
    /** Short opt-in label beside the checkbox (transactional SMS). */
    notificationsConsentCheckboxLabel: string;
    /** TCPA / carrier fine print under the checkbox. Takes businessName. */
    notificationsConsentFinePrint: (businessName: string) => string;
    /** Inline linked text to `/privacy` after consent copy. */
    notificationsSmsFinePrintLinkLabel: string;
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
  serviceLocation: {
    chooseHeading: string;
    chooseSubtitle: string;
    mobileOption: string;
    mobileOptionDesc: string;
    shopOption: string;
    shopOptionDesc: string;
    shopVisitAddressLabel: string;
    shopAddressIncomplete: string;
    backToServiceChoice: string;
    backToShopLocation: string;
    ownerChooseHeading: string;
    ownerChooseSubtitle: string;
    ownerMobileOption: string;
    ownerMobileOptionDesc: string;
    ownerShopOption: string;
    ownerShopOptionDesc: string;
  };
  customerForm: {
    yourDetails: string;
    customerDetails: string;
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
    reviewsTab: string;
    noBioYet: string;
    /** Public profile: free cap — clarify bookings are paused via ServiceLink only. */
    notTakingBookingsRightNow: string;
    reviewCountLabel: (count: number) => string;
    ratingAriaLabel: (average: string) => string;
    reviewsSectionTitle: string;
    reviewsShowingSample: string;
    reviewsLoadError: string;
    reviewsRetry: string;
    reviewsLoadingAriaLabel: string;
    /** Public profile: uncategorized services tab label. */
    serviceCategoryOther: string;
    /** Public profile: category filter tablist label. */
    serviceCategoriesAriaLabel: string;
    /** Public profile: empty state when a category has no services. */
    noServicesInCategory: string;
  };
  quoteForm: {
    quoteDetails: string;
    serviceRequested: string;
    serviceRequestedPlaceholder: string;
    whenOptional: string;
    whenPlaceholder: string;
    detailsLabel: string;
    detailsPlaceholder: string;
    submitRequest: string;
    timelineAsap: string;
    timelineThisWeek: string;
    timelineNextTwoWeeks: string;
    timelineThisMonth: string;
    timelineFlexible: string;
    errName: string;
    errEmail: string;
    errPhone: string;
    errService: string;
    errDetails: string;
    errVehicleYear: string;
    errVehicleMake: string;
    errVehicleModel: string;
    submitErrorGeneric: string;
  };
};
