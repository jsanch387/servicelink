/**
 * Business Services Service - Onboarding Feature
 *
 * Handles CRUD operations for business_services table.
 * Clean, modular service management for onboarding and dashboard.
 */

import { createClient } from '@/libs/supabase';

export interface Service {
  id?: string;
  name: string;
  description: string;
  price: string; // Frontend stores as string, converts to cents for DB
  hours_to_complete?: number;
}

export interface ServiceRow {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  price_cents: number | null;
  hours_to_complete: number | null;
  duration_minutes: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class BusinessServicesService {
  /**
   * Converts price string to cents for database storage
   */
  private static priceToCents(priceString: string): number | null {
    if (!priceString.trim()) return null;

    // Remove currency symbols and spaces
    const cleanPrice = priceString.replace(/[$,\s]/g, '');
    const price = parseFloat(cleanPrice);

    if (isNaN(price)) return null;
    return Math.round(price * 100); // Convert to cents
  }

  /**
   * Converts cents back to price string for frontend
   */
  private static centsToPrice(cents: number | null): string {
    if (cents === null) return '';
    return (cents / 100).toFixed(2);
  }

  /**
   * Gets all services for a business profile
   */
  static async getServicesByBusinessId(businessId: string): Promise<{
    success: boolean;
    data?: Service[];
    error?: string;
  }> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('business_services')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true) // Only active services
        .order('created_at', { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      // Convert database rows to frontend format (prefer duration_minutes, fallback to hours_to_complete)
      const services: Service[] = data.map((row: ServiceRow) => {
        const hoursFromMinutes =
          row.duration_minutes != null ? row.duration_minutes / 60 : null;
        const hours = hoursFromMinutes ?? row.hours_to_complete ?? undefined;
        return {
          id: row.id,
          name: row.name,
          description: row.description || '',
          price: this.centsToPrice(row.price_cents),
          hours_to_complete: hours,
        };
      });

      return { success: true, data: services };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to get services',
      };
    }
  }

  /**
   * Creates a new service for a business
   */
  static async createService(
    businessId: string,
    service: Service
  ): Promise<{
    success: boolean;
    data?: ServiceRow;
    error?: string;
  }> {
    try {
      const supabase = createClient();

      const serviceData = {
        business_id: businessId,
        name: service.name,
        description: service.description || null,
        price_cents: this.priceToCents(service.price),
        hours_to_complete: service.hours_to_complete || null,
        is_active: true, // All services are active by default
      };

      const { data, error } = await supabase
        .from('business_services')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert(serviceData as any)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to create service',
      };
    }
  }

  /**
   * Updates an existing service
   */
  static async updateService(
    serviceId: string,
    service: Service
  ): Promise<{
    success: boolean;
    data?: ServiceRow;
    error?: string;
  }> {
    try {
      const supabase = createClient();

      const updateData = {
        name: service.name,
        description: service.description || null,
        price_cents: this.priceToCents(service.price),
        hours_to_complete: service.hours_to_complete || null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('business_services')
        .update(updateData as never)
        .eq('id', serviceId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to update service',
      };
    }
  }

  /**
   * Deletes a service (sets is_active to false) - Soft Delete
   */
  static async deleteService(serviceId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('business_services')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', serviceId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to delete service',
      };
    }
  }

  /**
   * Permanently deletes a service from the database - Hard Delete
   */
  static async hardDeleteService(serviceId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('business_services')
        .delete()
        .eq('id', serviceId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to delete service',
      };
    }
  }

  /**
   * Bulk creates services for onboarding
   */
  static async createServicesForOnboarding(
    businessId: string,
    services: Service[]
  ): Promise<{
    success: boolean;
    data?: ServiceRow[];
    error?: string;
  }> {
    try {
      const supabase = createClient();

      // Filter out empty services
      const validServices = services.filter(
        service => service.name.trim() !== ''
      );

      if (validServices.length === 0) {
        return { success: true, data: [] };
      }

      const servicesData = validServices.map(service => ({
        business_id: businessId,
        name: service.name,
        description: service.description || null,
        price_cents: this.priceToCents(service.price),
        hours_to_complete: service.hours_to_complete || null,
        is_active: true,
      }));

      const { data, error } = await supabase
        .from('business_services')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert(servicesData as any)
        .select();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to create services',
      };
    }
  }
}
