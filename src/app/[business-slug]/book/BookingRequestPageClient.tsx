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
      // Call the API endpoint to submit the booking request
      const response = await fetch('/api/booking-request/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId,
          businessSlug,
          serviceName: serviceName || undefined,
          servicePrice: servicePrice, // Already in cents from the database
          formData: data,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        // Handle error - you might want to show an error message to the user
        console.error('Error submitting booking request:', result.error);
        alert(
          result.error || 'Failed to submit booking request. Please try again.'
        );
        setIsSubmitting(false);
        return;
      }

      // Show success message
      setShowSuccess(true);
    } catch (error) {
      console.error('Error submitting booking request:', error);
      alert('An unexpected error occurred. Please try again.');
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
