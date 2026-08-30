/**
 * Business Profile Feature - Main Export
 *
 * Central export point for business profile feature.
 * Clean, organized exports for easy importing.
 */

// Components
export { AboutUs } from './components/AboutUs';
export { BusinessProfileLoadingState } from './components/BusinessProfileLoadingState';
export { BusinessProfileView } from './components/BusinessProfileView';
export { EmptyState } from './components/EmptyState';
export { ProfileHeader } from './components/ProfileHeader';
export { QuoteButton } from './components/QuoteButton';
export { ProfileBioSection } from './components/ProfileBioSection';
export {
  ReviewsSection,
  ProfileRatingSummary,
  ProfileReviewCard,
  ProfileReviewsSummary,
  StarRatingDisplay,
  PROFILE_REVIEW_STAR_COLOR,
  formatAverageRating,
  formatReviewDate,
} from './reviews';
export type { StarRatingDisplaySize } from './reviews';
export { ServiceCard } from './components/ServiceCard';
export { ServicesList } from './components/ServicesList';
export { WorkShowcase } from './components/WorkShowcase';

// Edit Components
export { EditBusinessProfile } from './components/edit/EditBusinessProfile';
export { EditProfileActionBar } from './components/edit/EditProfileActionBar';
export { EditProfileTabNav } from './components/edit/EditProfileTabNav';
export { parseEditProfileTab, tabForSaveErrors } from './utils/editProfileTab';
export type { EditProfileTabId } from './utils/editProfileTab';

// Dashboard profile edit cards
export { DashboardProfileBookingLanguageCard } from './components/DashboardProfileBookingLanguageCard';
export { DashboardProfileBookingPolicyCard } from './components/DashboardProfileBookingPolicyCard';
export { DashboardProfileServiceLocationCard } from './components/DashboardProfileServiceLocationCard';
export { DashboardProfileCoverageCard } from './components/DashboardProfileCoverageCard';
export { ProfileCompletionTracker } from './components/ProfileCompletionTracker';
export { ProfileLocationFields } from './components/ProfileLocationFields';
export { SpecialtyChips } from './components/SpecialtyChips';

// Edit Section Components
export { BusinessInfoSection } from './components/edit/sections/BusinessInfoSection';
export { ContactSection } from './components/edit/sections/ContactSection';
export { BannerSection } from './components/edit/sections/BannerSection';
export { ProfileImageSection } from './components/edit/sections/ProfileImageSection';
export { PortfolioSection } from './components/edit/sections/PortfolioSection';

// Constants
export { BUSINESS_BIO_MAX_LENGTH } from './constants/businessBio';
export {
  DEFAULT_SERVICE_RADIUS_MILES,
  SERVICE_RADIUS_OPTIONS,
} from './constants/serviceRadius';

// Services
export { BusinessProfileApi } from './services/businessProfileApi';

// Types
export type {
  PrimaryServiceArea,
  PublicServiceCoverage,
} from './types/primaryServiceArea';
export * from './types/businessProfile';

// Utils
export * from './utils/businessProfileHelpers';
export * from './utils/location';

// Editing Utils
export {
  validateEditingForm,
  transformFormDataForAPI,
  saveBusinessProfile,
  formatPhoneForDisplay,
  formatPriceForDisplay,
  createNewImage,
  cleanupPreviewUrls,
} from './utils/editing/editingHelpers';
