import type { PublicBookingUi } from '../catalogTypes';

export const publicBookingUiEn: PublicBookingUi = {
  nav: {
    backToDateTime: 'Back to date & time',
    backToDetails: 'Back to details',
    backToReview: 'Back to review',
    backToProfile: 'Back to profile',
    backToService: 'Back to service',
    backToOptions: 'Back to options',
    backToAddOns: 'Back to add-ons',
    backToServices: 'Back to services',
    backToBookings: 'Back to bookings',
  },
  common: {
    continue: 'Continue',
    select: 'Select',
    summary: 'Summary',
    total: 'Total',
    deposit: 'Deposit',
    depositPercentOfTotal: pct => `Deposit (${pct}% of total)`,
    dueNow: 'Due now',
    remaining: 'Remaining',
    bookingTotal: 'Booking total',
    service: 'Service',
    addOns: 'Add-ons',
    date: 'Date',
    time: 'Time',
    duration: 'Duration',
    vehicle: 'Vehicle',
    notes: 'Notes',
    contact: 'Contact',
    address: 'Address',
    dateAndTime: 'Date & time',
    emailNotProvided: 'No email provided',
  },
  serviceDetails: {
    startingAt: 'Starting at',
    chooseOption: 'Choose an option',
    optionalAddOns: 'Optional add-ons',
    dateAndTime: 'Date & time',
    continue: 'Continue',
    backToOptions: 'Back to options',
    backToProfile: 'Back to profile',
    backToServices: 'Back to services',
  },
  bookPicker: {
    noServicesOwnerTitle: 'No services to pick yet.',
    noServicesPublicTitle: 'No services yet.',
    noServicesOwnerBody:
      'Go to Services in your dashboard. Add a service, then come back here.',
    noServicesPublicBody:
      'Services will show up here when this business adds them.',
    createAppointmentTitle: 'Create new appointment',
    bookWithTitle: name => `Book with ${name}`,
    createAppointmentSubtitle:
      'You are creating a new appointment. Choose a service below to continue.',
    bookWithSubtitle:
      'Pick a service. You can add extras next if there are any. Then pick date and time.',
  },
  notAccepting: {
    title: "This business isn't accepting bookings yet.",
    body: 'Check back later or contact them directly.',
  },
  calendar: {
    chooseTime: 'Choose time',
    selectDateHint: 'Select a date to see available times.',
    noSlotsHint: 'No available times for this date.',
    reviewBooking: 'Review your booking',
    reviewBookingCta: 'Review Booking',
    notificationsConsentLabel:
      'By confirming this appointment, you agree to receive email and SMS notifications about your booking.',
    notificationsSmsFinePrintBeforeLink:
      'Message and data rates may apply. Reply STOP to opt out. See our ',
    notificationsSmsFinePrintLinkLabel: 'SMS-compliant Privacy Policy',
    notificationsSmsFinePrintAfterLink: '.',
    notificationsConsentRequired:
      'Please check the box to agree to email and SMS notifications before continuing.',
    continueToPayment: 'Continue to payment',
    confirmBooking: 'Confirm Booking',
    chooseHowToPay: 'Choose how to pay',
    paymentHeading: 'Payment',
    howDoYouWantToPay: 'How do you want to pay?',
    payWithCard: 'Pay with card',
    payWithCardDescFull: 'Pay the full total now by card.',
    payWithCardDescDeposit:
      'Pay the full total now by card (your deposit is included).',
    payInPerson: 'Pay in person',
    payInPersonDescNoDeposit: 'Pay in person at your appointment.',
    payInPersonDescDeposit:
      'Pay the deposit now to book. Pay the rest in person at your appointment.',
    payInPersonNoteNoDeposit: 'Bring payment when you meet your provider.',
    payInPersonNoteDeposit:
      'Pay the deposit with your card on the next step. Pay the remaining balance in person when you meet your provider.',
    payInAppNoteDeposit:
      'The amount due now includes your deposit and confirms your spot.',
    payInAppNoteFull:
      'The full booking total is due by card to confirm your spot.',
    payNotSetupNote:
      'You can still continue; card checkout will be available once this business finishes payment setup.',
    onlinePaymentUnavailable:
      'Online payment is not available for this booking.',
    invalidPaymentAmount:
      'Invalid payment amount. Please refresh and try again.',
    paymentFinalizeWait:
      'Payment received, but we are still finalizing your booking. Please refresh in a moment.',
    stripeLeaveNotice: 'You will leave this page to pay securely with Stripe.',
    confirmingPaymentAria: 'Confirming payment',
    confirmingPaymentText: 'Confirming your payment…',
    goingToCheckout: 'Going to checkout',
    confirmingBooking: 'Confirming booking',
    payAmount: amount => `Pay ${amount}`,
    payDepositAmount: amount => `Pay ${amount} deposit`,
    depositPercentLead: (businessName, pct) =>
      `${businessName} requires ${pct}% of the total cost as a deposit to book this appointment. This deposit is non-refundable.`,
    depositFixedLead: (businessName, amount) =>
      `${businessName} requires a ${amount} deposit to book this appointment. This deposit is non-refundable.`,
    payInFullLead: businessName =>
      `${businessName} asks you to pay in full by card to confirm this booking.`,
    payInPersonLead: businessName =>
      `${businessName} collects payment when you meet—nothing is charged here today.`,
    paymentNotSetupLead: businessName =>
      `Payment options for ${businessName} are not fully set up yet. You will not be charged here today.`,
  },
  customerForm: {
    yourDetails: 'Your details',
    serviceAddress: 'Service address',
    vehicle: 'Vehicle',
    fullName: 'Full Name',
    email: 'Email',
    phone: 'Phone',
    streetAddress: 'Street Address',
    unitApt: 'Unit / Apt (optional)',
    city: 'City',
    state: 'State',
    zip: 'ZIP',
    year: 'Year',
    make: 'Make',
    model: 'Model',
    notesOptional: 'Notes (optional)',
    notesPlaceholder: 'Any special requests or access instructions…',
    errFullName: 'Full name is required',
    errEmail: 'Email is required',
    errPhone: 'Phone is required',
    errStreet: 'Street address is required',
    errCity: 'City is required',
    errState: 'State is required',
    errZip: 'ZIP is required',
    errZipInvalid: 'Enter a valid US ZIP (5 digits, or 9 digits for ZIP+4)',
    errVehicleYear: 'Vehicle year is required',
    errVehicleYearInvalid: 'Enter a valid 4-digit year',
    errVehicleMake: 'Vehicle make is required',
    errVehicleModel: 'Vehicle model is required',
    emailOptional: 'Email (optional)',
    emailOptionalNoConfirmation:
      'Without an email address, no booking confirmation email will be sent.',
    errEmailInvalid: 'Please enter a valid email address',
    errValueTooLong: 'This value is too long',
  },
  bookingSuccess: {
    title: "You're booked",
    subtitleOwner:
      'Your appointment has been created. Your customer will receive an email notification.',
    subtitleOwnerNoCustomerEmail:
      'Your appointment has been created. No confirmation email was sent because no customer email was provided.',
    subtitleCustomer: businessName =>
      `Your appointment with ${businessName} is confirmed. See you then!`,
    subtitleCustomerNoEmail: businessName =>
      `Your appointment with ${businessName} is confirmed. No confirmation email was sent because no email address was provided.`,
    cardHeaderOwner: 'Appointment',
    cardHeaderCustomer: 'Your booking',
    ownerPaymentNote: 'Payment details are saved with this appointment.',
    customerPaymentNote:
      'Payment details will be shared in your booking confirmation.',
    goToBookings: 'Go to bookings',
    backToProfile: 'Back to profile',
  },
  bookingPaymentSuccess: {
    paidFullTitle: 'Payment received',
    depositTitle: 'Deposit received',
    heroPaidFull: businessName =>
      `Your appointment with ${businessName} is confirmed and paid in full through ServiceLink.`,
    heroDeposit: businessName =>
      `Your appointment with ${businessName} is confirmed. Your deposit was received through ServiceLink; the rest is due later as agreed with your provider.`,
    cardHeader: 'Your booking',
    serviceLinkPayment: 'ServiceLink payment',
    paidNow: 'Paid now',
    remaining: 'Remaining',
    confirmationNote:
      'A confirmation email was sent with these details. If you paid by card, Stripe may send a receipt as well.',
    backToProfile: 'Back to profile',
  },
  serviceCard: {
    startingAt: 'Starting at',
    seeMore: 'See more',
    seeLess: 'See less',
    contactForQuote: 'Contact for quote',
  },
  profile: {
    requestQuote: 'Request Quote',
    contactPhoneCta: 'Contact',
    quotePageSubtitle: businessName =>
      `Share a few details and ${businessName} will send back a quote.`,
    servicesTab: 'Services',
    galleryTab: 'Gallery',
    bioTab: 'Bio',
    reviewsTab: 'Reviews',
    noBioYet: 'No bio added yet.',
    notTakingBookingsRightNow:
      'Not taking bookings through ServiceLink right now.',
    reviewCountLabel: count => (count === 1 ? '1 review' : `${count} reviews`),
    ratingAriaLabel: average => `${average} out of 5 stars`,
    reviewsSectionTitle: 'Customer reviews',
    reviewsShowingSample: 'Showing recent reviews',
  },
};
