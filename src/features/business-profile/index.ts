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

// Edit Section Components
export { BusinessInfoSection } from './components/edit/sections/BusinessInfoSection';
export { ContactSection } from './components/edit/sections/ContactSection';
export { BannerSection } from './components/edit/sections/BannerSection';
export { ProfileImageSection } from './components/edit/sections/ProfileImageSection';
export { PortfolioSection } from './components/edit/sections/PortfolioSection';

// Constants
export { BUSINESS_BIO_MAX_LENGTH } from './constants/businessBio';

// Services
export { BusinessProfileApi } from './services/businessProfileApi';

// Types
export * from './types/businessProfile';

// Utils
export * from './utils/businessProfileHelpers';

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
