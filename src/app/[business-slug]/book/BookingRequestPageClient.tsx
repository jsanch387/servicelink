'use client';

import { BookingRequestForm } from '@/features/booking-request/components/BookingRequestForm';
import { BookingRequestSuccess } from '@/features/booking-request/components/BookingRequestSuccess';
import { BookingRequestFormData } from '@/features/booking-request/types/bookingRequest';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface BookingRequestPageClientProps {
  businessName: string;
  businessId: string;
  businessSlug: string;
  serviceName?: string;
  servicePrice?: number;
}

export function BookingRequestPageClient({
  businessName,
  businessId,
  businessSlug,
  serviceName = '',
  servicePrice,
}: BookingRequestPageClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (data: BookingRequestFormData) => {
    setIsSubmitting(true);

    try {
      // For now, just log the data
      // Later we'll add API calls and database writes
      const submitData = {
        ...data,
        businessId,
        businessSlug,
        submittedAt: new Date().toISOString(),
      };

      console.log('Booking Request Submitted:', submitData);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Show success message
      setShowSuccess(true);
    } catch (error) {
      console.error('Error submitting booking request:', error);
      setIsSubmitting(false);
    }
  };

  const handleDone = () => {
    router.push(`/${businessSlug}`);
  };

  // Show success screen after successful submission
  if (showSuccess) {
    return (
      <BookingRequestSuccess businessName={businessName} onDone={handleDone} />
    );
  }

  return (
    <BookingRequestForm
      businessName={businessName}
      serviceName={serviceName}
      servicePrice={servicePrice}
      onSubmit={handleSubmit}
      isLoading={isSubmitting}
    />
  );
}
