import { useCallback, useState } from 'react';
import { WaitlistApi, WaitlistResponse } from '../services/waitlistApi';
import { useRateLimit } from '../utils/rateLimiter';

interface UseWaitlistReturn {
  isLoading: boolean;
  isSubmitted: boolean;
  error: string | null;
  successMessage: string | null;
  submitEmail: (email: string) => Promise<void>;
  reset: () => void;
}

export function useWaitlist(): UseWaitlistReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { checkRateLimit } = useRateLimit();

  const submitEmail = useCallback(
    async (email: string): Promise<void> => {
      // Reset previous states
      setError(null);
      setSuccessMessage(null);

      // Basic validation
      if (!email || !email.trim()) {
        setError('Please enter your email address');
        return;
      }

      // Check rate limit
      const { allowed, timeUntilReset } = checkRateLimit();
      // const { remaining } = checkRateLimit(); // Will be used later
      if (!allowed) {
        const minutes = Math.ceil(timeUntilReset / 60000);
        setError(
          `Too many requests. Please wait ${minutes} minute${minutes > 1 ? 's' : ''} before trying again.`
        );
        return;
      }

      setIsLoading(true);

      try {
        const response: WaitlistResponse = await WaitlistApi.addToWaitlist(
          email.trim()
        );

        if (response.success) {
          setIsSubmitted(true);
          setSuccessMessage(response.message);
          setError(null);
        } else {
          setError(response.message);
          setSuccessMessage(null);
        }
      } catch (err) {
        console.error('Error submitting to waitlist:', err);
        setError('Something went wrong. Please try again.');
        setSuccessMessage(null);
      } finally {
        setIsLoading(false);
      }
    },
    [checkRateLimit]
  );

  const reset = useCallback(() => {
    setIsSubmitted(false);
    setError(null);
    setSuccessMessage(null);
    setIsLoading(false);
  }, []);

  return {
    isLoading,
    isSubmitted,
    error,
    successMessage,
    submitEmail,
    reset,
  };
}
