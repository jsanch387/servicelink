import { LandingPageDisplayImage } from '@/features/landing-page/components/LandingPageDisplayImage';

export function AdsWorkshopBookingLinkMock() {
  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="text-center">
        <p className="text-sm font-medium text-white">
          Where your ad clicks land
        </p>
        <p className="mt-1 text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
          Your booking profile on mobile — services, schedule, and deposits in
          one link.
        </p>
      </div>
      <LandingPageDisplayImage
        variant="compact"
        className="w-full overflow-visible"
      />
    </div>
  );
}
