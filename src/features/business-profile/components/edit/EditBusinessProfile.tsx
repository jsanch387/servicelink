'use client';

import {
  resolveBusinessSpecialties,
  specialtiesAllowedForBusinessType,
} from '@/constants/businessSpecialties';
import { useUploadPortfolio } from '@/features/media/hooks';
import type { StructuredLocation } from '@/features/location/types/location';
import React, { useEffect, useState } from 'react';
import {
  buildServiceAreaPayload,
  savePrimaryServiceArea,
} from '../../api/savePrimaryServiceArea';
import {
  DEFAULT_SERVICE_RADIUS_MILES,
  normalizeServiceRadiusMiles,
} from '../../constants/serviceRadius';
import { SHOP_ADDRESS_FIELD_ID } from '../../constants/shopAddressPrompt';
import { CompleteBusinessProfile } from '../../types/businessProfile';
import type { PrimaryServiceArea } from '../../types/primaryServiceArea';
import {
  bookingLinkLocalesPersistFromUi,
  bookingLinkLocalesUiFromProfile,
  type BookingLinkLocalesUiState,
} from '../../utils/bookingLinkLocales';
import {
  EditingFormData,
  ImageFormData,
  cleanupPreviewUrls,
  saveBusinessProfile,
} from '../../utils/editing/editingHelpers';
import { DashboardProfileBookingLanguageCard } from '../DashboardProfileBookingLanguageCard';
import { DashboardProfileBookingPolicyCard } from '../DashboardProfileBookingPolicyCard';
import { DashboardProfileServiceLocationCard } from '../DashboardProfileServiceLocationCard';
import {
  bookingPolicyPersistFromUi,
  bookingPolicyUiFromProfile,
  type BookingPolicyUiState,
} from '../../utils/bookingPolicy';
import {
  serviceLocationPersistFromUi,
  serviceLocationUiFromProfile,
} from '../../utils/serviceLocationMode';
import type { ServiceLocationUiState } from '../../utils/serviceLocationMode';
import {
  parseSocialMedia,
  socialMediaForPersist,
} from '../../utils/socialMedia';
import {
  formatProfileLocationLabel,
  formatServiceArea,
  parseServiceAreaCityState,
} from '../../utils/businessLocation';
import {
  formatServiceCoverageLabel,
  isServiceCoverageDirty,
  primaryServiceAreaToStructuredLocation,
  structuredLocationToPrimaryServiceArea,
  validateServiceCoverage,
} from '../../utils/primaryServiceArea';
import { BannerSection } from './sections/BannerSection';
import { BusinessInfoSection } from './sections/BusinessInfoSection';
import { ContactSection } from './sections/ContactSection';
import { PortfolioSection } from './sections/PortfolioSection';
import { ProfileImageSection } from './sections/ProfileImageSection';
import { EditProfileTabNav } from './EditProfileTabNav';
import {
  tabForSaveErrors,
  type EditProfileTabId,
} from '../../utils/editProfileTab';
import { EditProfileActionBar } from './EditProfileActionBar';

/**
 * HEIC Conversion for MVP
 *
 * Converts HEIC files (iPhone photos) to JPEG before upload.
 * This ensures compatibility across all browsers and platforms.
 *
 * Process:
 * 1. User selects HEIC file → Shows professional placeholder preview
 * 2. User clicks Save → HEIC files converted to JPEG on server
 * 3. JPEG files uploaded to Supabase → Works everywhere
 */
const convertHeicFiles = async (files: File[]): Promise<File[]> => {
  const convertedFiles: File[] = [];

  for (const file of files) {
    // Check if it's a HEIC file
    const isHeic =
      file.type === 'image/heic' ||
      file.type === 'image/heif' ||
      file.name.toLowerCase().endsWith('.heic') ||
      file.name.toLowerCase().endsWith('.heif');

    if (isHeic) {
      try {
        // Send HEIC file to server for conversion
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/convert-heic', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'HEIC conversion failed');
        }

        // Get converted JPEG blob
        const jpegBlob = await response.blob();

        // Create new File object with JPEG extension
        const convertedFile = new File(
          [jpegBlob],
          file.name.replace(/\.(heic|heif)$/i, '.jpg'),
          { type: 'image/jpeg' }
        );

        convertedFiles.push(convertedFile);
      } catch {
        // If conversion fails, keep the original file
        convertedFiles.push(file);
      }
    } else {
      // Not a HEIC file, keep as is
      convertedFiles.push(file);
    }
  }

  return convertedFiles;
};

interface EditBusinessProfileProps {
  businessProfile: CompleteBusinessProfile;

  onSave: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  /** When true, show upgrade CTA in portfolio when at image limit. */
  isFreeTier?: boolean;
  /** Primary `business_service_areas` row for Details → Location. */
  primaryServiceArea?: PrimaryServiceArea | null;
  onPrimaryServiceAreaChange?: (area: PrimaryServiceArea) => void;
  initialTab?: EditProfileTabId;
  focusShopAddress?: boolean;
}

function initialFormLocation(
  profile: CompleteBusinessProfile,
  area?: PrimaryServiceArea | null
) {
  if (area) {
    return {
      service_area: formatServiceArea(area.city, area.stateCode),
      business_zip: area.postalCode || profile.business_zip || '',
    };
  }
  return {
    service_area: profile.service_area || '',
    business_zip: profile.business_zip || '',
  };
}

export const EditBusinessProfile: React.FC<EditBusinessProfileProps> = ({
  businessProfile,
  onSave,
  onCancel,
  isLoading,
  isFreeTier = false,
  primaryServiceArea = null,
  onPrimaryServiceAreaChange,
  initialTab = 'photos',
  focusShopAddress = false,
}) => {
  const [savedServiceArea, setSavedServiceArea] =
    useState<PrimaryServiceArea | null>(primaryServiceArea);
  const [selectedLocation, setSelectedLocation] =
    useState<StructuredLocation | null>(() =>
      primaryServiceArea
        ? primaryServiceAreaToStructuredLocation(primaryServiceArea)
        : null
    );
  const [locationQuery, setLocationQuery] = useState(
    () => primaryServiceArea?.label ?? businessProfile.service_area ?? ''
  );
  const [radiusMiles, setRadiusMiles] = useState(() =>
    primaryServiceArea
      ? normalizeServiceRadiusMiles(primaryServiceArea.radiusMiles)
      : DEFAULT_SERVICE_RADIUS_MILES
  );

  // Form state
  const [formData, setFormData] = useState<EditingFormData>(() => {
    const social = parseSocialMedia(businessProfile.social_media);
    const locationFields = initialFormLocation(
      businessProfile,
      primaryServiceArea
    );
    return {
      business_name: businessProfile.business_name || '',
      business_type: businessProfile.business_type || '',
      specialties: resolveBusinessSpecialties(
        businessProfile.business_type,
        businessProfile.specialties
      ),
      service_area: locationFields.service_area,
      business_zip: locationFields.business_zip,
      bio: businessProfile.bio || '',
      phone_number_call: businessProfile.phone_number_call || '',
      phone_number_text: '', // Not used; we only store one number (call)
      same_phone_for_both: false,
      instagram: social.instagram ? `@${social.instagram}` : '',
      tiktok: social.tiktok ? `@${social.tiktok}` : '',
      logo_path: businessProfile.logo_path || '',
      banner_path: businessProfile.banner_path || '',
      images:
        businessProfile.images?.map(image => ({
          id: image.id,
          storage_path: image.storage_path,
          position: image.position,
        })) || [],
    };
  });

  const [bookingLinkLocales, setBookingLinkLocales] =
    useState<BookingLinkLocalesUiState>(() =>
      bookingLinkLocalesUiFromProfile(businessProfile)
    );

  const [serviceLocation, setServiceLocation] =
    useState<ServiceLocationUiState>(() =>
      serviceLocationUiFromProfile(businessProfile)
    );

  const [bookingPolicy, setBookingPolicy] = useState<BookingPolicyUiState>(() =>
    bookingPolicyUiFromProfile(businessProfile)
  );

  const [activeTab, setActiveTab] = useState<EditProfileTabId>(initialTab);

  const [errors, setErrors] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { uploadPortfolio, isUploading: isUploadingPortfolio } =
    useUploadPortfolio();

  // Combined loading state
  const isAnyLoading = isLoading || isSaving || isUploadingPortfolio;

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      cleanupPreviewUrls(formData.images);
    };
  }, [formData.images]);

  useEffect(() => {
    if (focusShopAddress && activeTab === 'booking') {
      const timer = window.setTimeout(() => {
        const field = document.getElementById(SHOP_ADDRESS_FIELD_ID);
        field?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        field?.focus();
      }, 80);
      return () => window.clearTimeout(timer);
    }

    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeTab, focusShopAddress]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors.length > 0) setErrors([]);
  };

  const handleBusinessTypeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      business_type: value,
      specialties: specialtiesAllowedForBusinessType(value, prev.specialties),
    }));
    if (errors.length > 0) setErrors([]);
  };

  const handleSpecialtiesChange = (next: string[]) => {
    setFormData(prev => ({ ...prev, specialties: next }));
    if (errors.length > 0) setErrors([]);
  };

  const applySelectedLocation = (location: StructuredLocation) => {
    setSelectedLocation(location);
    setLocationQuery(location.label);
    setFormData(prev => ({
      ...prev,
      service_area: formatServiceArea(location.city, location.state),
      business_zip: location.zip.trim() || prev.business_zip,
    }));
    if (errors.length > 0) setErrors([]);
  };

  const handleLocationQueryChange = (value: string) => {
    setLocationQuery(value);
    setSelectedLocation(null);
    if (errors.length > 0) setErrors([]);
  };

  const handleRadiusChange = (miles: number) => {
    setRadiusMiles(normalizeServiceRadiusMiles(miles));
    if (errors.length > 0) setErrors([]);
  };

  const handleImagesChange = (images: ImageFormData[]) => {
    setFormData(prev => ({ ...prev, images }));
  };

  const handleFilesChange = (files: File[]) => {
    setSelectedFiles(files);
  };

  const handleCoverImageChange = (
    file: File,
    publicUrl?: string,
    storagePath?: string
  ) => {
    // If we have a public URL from successful upload, use that
    // Otherwise, create a preview URL for immediate display
    const bannerUrl = publicUrl || URL.createObjectURL(file);

    // Update form data with new cover image URL and storage path
    setFormData(prev => ({
      ...prev,
      cover_image_url: bannerUrl,
      banner_path: storagePath || prev.banner_path,
    }));

    // If we have a successful upload with public URL, immediately update the parent businessProfile
    // This ensures the cover photo shows immediately when switching to preview mode
    if (publicUrl && storagePath) {
      // Call the parent's onSave callback with just the cover photo updates
      onSave({
        cover_image_url: bannerUrl,
        banner_path: storagePath,
      });
    }
  };

  const handleLogoImageChange = (
    file: File,
    publicUrl?: string,
    storagePath?: string
  ) => {
    // If we have a public URL from successful upload, use that
    // Otherwise, create a preview URL for immediate display
    const logoUrl = publicUrl || URL.createObjectURL(file);

    // Update form data with new logo URL and storage path
    setFormData(prev => ({
      ...prev,
      logo_url: logoUrl,
      logo_path: storagePath || prev.logo_path,
    }));

    // If we have a successful upload with public URL, immediately update the parent businessProfile
    // This ensures the logo shows immediately when switching to preview mode
    if (publicUrl && storagePath) {
      // Call the parent's onSave callback with just the logo updates
      onSave({
        logo_url: logoUrl,
        logo_path: storagePath,
      });
    }
  };

  // Save all changes
  const handleSave = async () => {
    setIsSaving(true);
    setErrors([]);

    try {
      let finalFormData = formData;

      // First, upload any pending portfolio images to storage
      if (selectedFiles.length > 0) {
        // Convert HEIC files to JPEG before uploading
        const convertedFiles = await convertHeicFiles(selectedFiles);

        const result = await uploadPortfolio({
          businessId: businessProfile.id,
          files: convertedFiles,
          previousImages: [], // No previous images for now
        });

        if (result.every(r => r.success)) {
          // Update form data with real storage paths
          const previewImages = formData.images.filter(img =>
            img.id?.toString().startsWith('preview-')
          );
          const existingImages = formData.images.filter(
            img => !img.id?.toString().startsWith('preview-')
          );

          // Map uploaded results to preview images
          const uploadedImages: ImageFormData[] = previewImages
            .map((img, index) => {
              const uploadResult = result[index];
              if (!uploadResult || !uploadResult.success) {
                return null;
              }

              return {
                storage_path: uploadResult.storagePath!,
                position: img.position,
                preview_url: uploadResult.publicUrl,
              } as ImageFormData;
            })
            .filter((img): img is ImageFormData => img !== null);

          // Update form data with uploaded images
          const updatedImages = [...existingImages, ...uploadedImages];

          // Create updated form data
          finalFormData = { ...formData, images: updatedImages };
          setFormData(finalFormData);
          setSelectedFiles([]);
        } else {
          const uploadErrors = [
            'Failed to upload gallery images. Please try again.',
          ];
          setErrors(uploadErrors);
          setActiveTab(tabForSaveErrors(uploadErrors));
          return;
        }
      }

      const coverageErrors = validateServiceCoverage(
        selectedLocation,
        radiusMiles
      );
      if (coverageErrors.length > 0) {
        setErrors(coverageErrors);
        setActiveTab(tabForSaveErrors(coverageErrors));
        return;
      }

      const baselineCoverage = {
        location: savedServiceArea
          ? primaryServiceAreaToStructuredLocation(savedServiceArea)
          : null,
        radiusMiles: savedServiceArea
          ? normalizeServiceRadiusMiles(savedServiceArea.radiusMiles)
          : DEFAULT_SERVICE_RADIUS_MILES,
      };

      if (
        selectedLocation &&
        isServiceCoverageDirty(baselineCoverage, {
          location: selectedLocation,
          radiusMiles,
        })
      ) {
        const areaResult = await savePrimaryServiceArea(
          buildServiceAreaPayload(selectedLocation, radiusMiles)
        );
        if (!areaResult.success) {
          const areaErrors = [
            areaResult.error || 'Unable to save service area.',
          ];
          setErrors(areaErrors);
          setActiveTab(tabForSaveErrors(areaErrors));
          return;
        }

        const nextArea = structuredLocationToPrimaryServiceArea(
          selectedLocation,
          radiusMiles,
          savedServiceArea?.id
        );
        setSavedServiceArea(nextArea);
        onPrimaryServiceAreaChange?.(nextArea);
        finalFormData = {
          ...finalFormData,
          service_area: formatServiceArea(
            selectedLocation.city,
            selectedLocation.state
          ),
          business_zip:
            selectedLocation.zip.trim() || finalFormData.business_zip,
        };
        setFormData(finalFormData);
      }

      // Save everything to database
      const result = await saveBusinessProfile(
        businessProfile.id,
        finalFormData,
        bookingLinkLocales,
        serviceLocation,
        bookingPolicy
      );

      if (result.success) {
        // Show success state briefly, then switch to preview mode
        setErrors([]);
        // The parent component will handle switching to preview mode
        // by calling onSave with the updated data
        const bookingPersist =
          bookingLinkLocalesPersistFromUi(bookingLinkLocales);
        const serviceLocationPersist =
          serviceLocationPersistFromUi(serviceLocation);
        const policyPersist = bookingPolicyPersistFromUi(bookingPolicy);
        await onSave({
          ...(finalFormData as unknown as Record<string, unknown>),
          social_media: socialMediaForPersist({
            instagram: finalFormData.instagram,
            tiktok: finalFormData.tiktok,
          }),
          public_booking_locales: bookingPersist.public_booking_locales,
          public_booking_default_locale:
            bookingPersist.public_booking_default_locale,
          ...serviceLocationPersist,
          ...policyPersist,
        });
      } else {
        const saveErrors = [result.error || 'Failed to save business profile'];
        setErrors(saveErrors);
        setActiveTab(tabForSaveErrors(saveErrors));
      }
    } catch {
      const saveErrors = ['An unexpected error occurred while saving'];
      setErrors(saveErrors);
      setActiveTab(tabForSaveErrors(saveErrors));
    } finally {
      setIsSaving(false);
    }
  };

  const { city, state } = parseServiceAreaCityState(formData.service_area);
  const profileLocationLabel = formatProfileLocationLabel(
    city,
    state,
    formData.business_zip
  );
  const coverageLabel =
    formatServiceCoverageLabel(
      selectedLocation?.city ?? city,
      selectedLocation?.state ?? state,
      selectedLocation ? radiusMiles : savedServiceArea?.radiusMiles
    ) ?? profileLocationLabel;

  return (
    <div className="min-h-screen bg-[#0f0f0f] pb-28">
      <div className="sticky top-16 z-20 bg-[#0f0f0f]/90 backdrop-blur-md lg:top-0">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-5">
          <EditProfileTabNav activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {errors.length > 0 && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
            <h4 className="text-red-400 font-medium mb-2">
              Please fix the following before saving:
            </h4>
            <ul className="text-red-300 text-sm space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'photos' ? (
          <div
            id="edit-profile-tabpanel-photos"
            role="tabpanel"
            aria-labelledby="edit-profile-tab-photos"
            className="space-y-6"
          >
            <BannerSection
              businessProfile={{
                ...businessProfile,
                cover_image_url:
                  formData.cover_image_url || businessProfile.cover_image_url,
                banner_path:
                  formData.banner_path || businessProfile.banner_path,
              }}
              isLoading={isLoading}
              onCoverImageChange={handleCoverImageChange}
            />

            <ProfileImageSection
              businessProfile={{
                ...businessProfile,
                logo_url: formData.logo_url || businessProfile.logo_url,
                logo_path: formData.logo_path || businessProfile.logo_path,
              }}
              isLoading={isLoading}
              onLogoImageChange={handleLogoImageChange}
            />

            <PortfolioSection
              images={formData.images}
              onImagesChange={handleImagesChange}
              onFilesChange={handleFilesChange}
              businessProfile={businessProfile}
              isLoading={isLoading}
              isFreeTier={isFreeTier}
            />
          </div>
        ) : null}

        {activeTab === 'details' ? (
          <div
            id="edit-profile-tabpanel-details"
            role="tabpanel"
            aria-labelledby="edit-profile-tab-details"
          >
            <BusinessInfoSection
              formData={formData}
              onInputChange={handleInputChange}
              onBusinessTypeChange={handleBusinessTypeChange}
              onSpecialtiesChange={handleSpecialtiesChange}
              errors={errors}
              locationQuery={locationQuery}
              onLocationQueryChange={handleLocationQueryChange}
              selectedLocation={selectedLocation}
              onSelectLocation={applySelectedLocation}
              radiusMiles={radiusMiles}
              onRadiusChange={handleRadiusChange}
            />
          </div>
        ) : null}

        {activeTab === 'booking' ? (
          <div
            id="edit-profile-tabpanel-booking"
            role="tabpanel"
            aria-labelledby="edit-profile-tab-booking"
            className="space-y-6"
          >
            <DashboardProfileServiceLocationCard
              value={serviceLocation}
              onChange={next => {
                setServiceLocation(next);
                if (errors.length > 0) setErrors([]);
              }}
              coverageLabel={coverageLabel}
              onEditDetails={() => setActiveTab('details')}
              locationQuery={locationQuery}
              onLocationQueryChange={handleLocationQueryChange}
              selectedLocation={selectedLocation}
              onSelectLocation={applySelectedLocation}
              radiusMiles={radiusMiles}
              onRadiusChange={handleRadiusChange}
              errors={errors}
            />

            <DashboardProfileBookingLanguageCard
              offerSpanish={bookingLinkLocales.offerSpanish}
              onOfferSpanishChange={offer => {
                setBookingLinkLocales(prev => ({
                  ...prev,
                  offerSpanish: offer,
                  visitorDefaultLocale: offer
                    ? prev.visitorDefaultLocale
                    : 'en',
                }));
              }}
              visitorDefaultLocale={bookingLinkLocales.visitorDefaultLocale}
              onVisitorDefaultLocaleChange={visitorDefaultLocale =>
                setBookingLinkLocales(prev => ({
                  ...prev,
                  visitorDefaultLocale,
                }))
              }
            />

            <DashboardProfileBookingPolicyCard
              value={bookingPolicy}
              onChange={next => {
                setBookingPolicy(next);
                if (errors.length > 0) setErrors([]);
              }}
              error={
                errors.find(message =>
                  message.toLowerCase().includes('policy')
                ) ?? undefined
              }
            />
          </div>
        ) : null}

        {activeTab === 'contact' ? (
          <div
            id="edit-profile-tabpanel-contact"
            role="tabpanel"
            aria-labelledby="edit-profile-tab-contact"
          >
            <ContactSection
              formData={formData}
              onInputChange={handleInputChange}
              errors={errors}
            />
          </div>
        ) : null}
      </div>

      <EditProfileActionBar
        onPreview={onCancel}
        onSave={handleSave}
        disabled={isAnyLoading}
        isSaving={isSaving}
        isUploading={isUploadingPortfolio}
      />
    </div>
  );
};
