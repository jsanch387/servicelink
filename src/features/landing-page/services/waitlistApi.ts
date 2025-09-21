export interface WaitlistEntry {
  id?: string;
  email: string;
  created_at?: string;
}

export interface WaitlistResponse {
  success: boolean;
  message: string;
  data?: WaitlistEntry;
  error?: string;
}

export class WaitlistApi {
  /**
   * Add a new email to the waitlist (simplified approach)
   */
  static async addToWaitlist(email: string): Promise<WaitlistResponse> {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return {
          success: false,
          message: 'Please enter a valid email address',
          error: 'Invalid email format',
        };
      }

      // Try to insert directly - let the database handle duplicates
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/waitlist`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
            Prefer: 'return=representation',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            email: email.toLowerCase(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        // Check if it's a duplicate email error
        if (result.code === '23505' || result.message?.includes('duplicate')) {
          return {
            success: false,
            message: 'This email is already on our waitlist!',
            error: 'Email already exists',
          };
        }

        return {
          success: false,
          message:
            result.message || 'Failed to join waitlist. Please try again.',
          error: result.error || 'Request failed',
        };
      }

      return {
        success: true,
        message: 'Successfully joined the waitlist!',
        data: result[0], // Supabase returns an array
      };
    } catch (error) {
      console.error('Unexpected error in addToWaitlist:', error);
      return {
        success: false,
        message: 'Something went wrong. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
