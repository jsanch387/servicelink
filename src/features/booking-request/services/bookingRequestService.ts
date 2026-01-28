/**
 * Booking Request Service
 *
 * Handles all database operations for booking requests.
 * Clean, modular database operations for booking request feature.
 */

import { createClient } from '@/libs/supabase';

/**
 * Response type for booking request operations
 */
export interface BookingRequestResponse {
  success: boolean;
  data?: {
    id: string;
    business_id: string;
    customer_name: string;
    customer_phone: string;
    preferred_date: string;
    preferred_time_window: string;
    service_name: string;
    service_price_cents: number | null;
    message: string | null;
    status: string;
    submitted_at: string;
    created_at: string;
  };
  error?: string;
}

/**
 * Data required to create a booking request
 */
export interface CreateBookingRequestData {
  businessId: string;
  businessSlug: string;
  serviceId?: string; // Optional - null for "General Inquiry"
  serviceName: string;
  servicePriceCents?: number | null;
  customerName: string;
  customerPhone: string;
  preferredDate: string; // Format: YYYY-MM-DD
  preferredTimeWindow: 'morning' | 'afternoon' | 'evening';
  message?: string;
  ipAddress?: string;
  userAgent?: string;
  referrerUrl?: string;
}

export class BookingRequestService {
  /**
   * Creates a new booking request in the database
   *
   * @param data - Booking request data
   * @returns Response with created booking request or error
   */
  static async createBookingRequest(
    data: CreateBookingRequestData
  ): Promise<BookingRequestResponse> {
    try {
      const supabase = createClient();

      // Validate required fields
      if (!data.businessId) {
        return { success: false, error: 'Business ID is required' };
      }

      if (!data.customerName || data.customerName.trim() === '') {
        return { success: false, error: 'Customer name is required' };
      }

      if (!data.customerPhone || data.customerPhone.trim() === '') {
        return { success: false, error: 'Customer phone is required' };
      }

      if (!data.preferredDate) {
        return { success: false, error: 'Preferred date is required' };
      }

      if (!data.preferredTimeWindow) {
        return { success: false, error: 'Preferred time window is required' };
      }

      if (!data.serviceName || data.serviceName.trim() === '') {
        return { success: false, error: 'Service name is required' };
      }

      // Validate date format (should be YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(data.preferredDate)) {
        return {
          success: false,
          error: 'Invalid date format. Expected YYYY-MM-DD',
        };
      }

      // Validate time window
      const validTimeWindows = ['morning', 'afternoon', 'evening'];
      if (!validTimeWindows.includes(data.preferredTimeWindow)) {
        return {
          success: false,
          error: 'Invalid time window. Must be morning, afternoon, or evening',
        };
      }

      // Prepare the insert data
      const insertData = {
        business_id: data.businessId,
        business_slug: data.businessSlug,
        service_id: data.serviceId || null,
        service_name: data.serviceName,
        service_price_cents: data.servicePriceCents || null,
        customer_name: data.customerName.trim(),
        customer_phone: data.customerPhone.trim(),
        preferred_date: data.preferredDate,
        preferred_time_window: data.preferredTimeWindow,
        message: data.message?.trim() || null,
        ip_address: data.ipAddress || null,
        user_agent: data.userAgent || null,
        referrer_url: data.referrerUrl || null,
        status: 'pending', // Default status
        submitted_at: new Date().toISOString(),
      };

      // Insert the booking request
      const { data: bookingRequest, error } = await supabase
        .from('booking_requests')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert(insertData as any)
        .select()
        .single();

      if (error) {
        console.error('Error creating booking request:', error);
        return {
          success: false,
          error: error.message || 'Failed to create booking request',
        };
      }

      if (!bookingRequest) {
        return {
          success: false,
          error: 'Failed to create booking request',
        };
      }

      return {
        success: true,
        data: bookingRequest,
      };
    } catch (error) {
      console.error('Unexpected error creating booking request:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      };
    }
  }

  /**
   * Gets all booking requests for a specific business
   *
   * @param businessId - The business ID
   * @param status - Optional status filter
   * @returns Response with booking requests or error
   */
  static async getBookingRequestsByBusiness(
    businessId: string,
    status?: string
  ): Promise<{
    success: boolean;
    data?: BookingRequestResponse['data'][];
    error?: string;
  }> {
    try {
      const supabase = createClient();

      let query = supabase
        .from('booking_requests')
        .select('*')
        .eq('business_id', businessId)
        .order('submitted_at', { ascending: false });

      // Apply status filter if provided
      if (status) {
        query = query.eq('status', status);
      }

      const { data: bookingRequests, error } = await query;

      if (error) {
        console.error('Error fetching booking requests:', error);
        return {
          success: false,
          error: error.message || 'Failed to fetch booking requests',
        };
      }

      return {
        success: true,
        data: bookingRequests || [],
      };
    } catch (error) {
      console.error('Unexpected error fetching booking requests:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      };
    }
  }

  /**
   * Updates the status of a booking request
   *
   * @param requestId - The booking request ID
   * @param status - New status
   * @param statusNotes - Optional notes about the status change
   * @returns Response with updated booking request or error
   */
  static async updateBookingRequestStatus(
    requestId: string,
    status: 'pending' | 'approved' | 'declined' | 'cancelled',
    statusNotes?: string
  ): Promise<BookingRequestResponse> {
    try {
      const supabase = createClient();

      // Validate status
      const validStatuses = ['pending', 'approved', 'declined', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return {
          success: false,
          error:
            'Invalid status. Must be pending, approved, declined, or cancelled',
        };
      }

      const updateData = {
        status,
        ...(statusNotes !== undefined && {
          status_notes: statusNotes.trim() || null,
        }),
      };

      const { data: bookingRequest, error } =
        await // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from('booking_requests') as any)
          .update(updateData)
          .eq('id', requestId)
          .select()
          .single();

      if (error) {
        console.error('Error updating booking request status:', error);
        return {
          success: false,
          error: error.message || 'Failed to update booking request status',
        };
      }

      if (!bookingRequest) {
        return {
          success: false,
          error: 'Booking request not found',
        };
      }

      return {
        success: true,
        data: bookingRequest,
      };
    } catch (error) {
      console.error('Unexpected error updating booking request:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      };
    }
  }
}
