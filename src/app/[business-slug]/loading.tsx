import { EchoBarsLoader } from '@/components/shared/EchoBarsLoader';

/** Shown while the public booking link (or post-Checkout return) loads. */
export default function PublicBusinessSlugLoading() {
  return (
    <div
      className="flex min-h-screen w-full items-center justify-center bg-[#0f0f0f]"
      aria-busy
      aria-live="polite"
    >
      <EchoBarsLoader
        size="large"
        color="#a3a3a3"
        accessibilityLabel="Loading"
      />
    </div>
  );
}
