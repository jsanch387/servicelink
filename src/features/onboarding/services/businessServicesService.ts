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
    console.log('🔍 Getting services for business:', businessId);

    try {
      const supabase = createClient() as any;

      const { data, error } = await supabase
        .from('business_services')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true) // Only active services
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Failed to get services:', error);
        return { success: false, error: error.message };
      }

      // Convert database rows to frontend format
      const services: Service[] = data.map((row: ServiceRow) => ({
        id: row.id,
        name: row.name,
        description: row.description || '',
        price: this.centsToPrice(row.price_cents),
        hours_to_complete: row.hours_to_complete || undefined,
      }));

      console.log('✅ Services retrieved:', services.length);
      return { success: true, data: services };
    } catch (error) {
      console.error('❌ Error getting services:', error);
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
    console.log('➕ Creating service for business:', businessId, service);

    try {
      const supabase = createClient() as any;

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
        .insert(serviceData)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to create service:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Service created:', data.id);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error creating service:', error);
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
    console.log('📝 Updating service:', serviceId, service);

    try {
      const supabase = createClient() as any;

      const updateData = {
        name: service.name,
        description: service.description || null,
        price_cents: this.priceToCents(service.price),
        hours_to_complete: service.hours_to_complete || null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('business_services')
        .update(updateData)
        .eq('id', serviceId)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to update service:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Service updated:', data.id);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error updating service:', error);
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
    console.log('🗑️ Soft deleting service:', serviceId);

    try {
      const supabase = createClient() as any;

      const { error } = await supabase
        .from('business_services')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', serviceId);

      if (error) {
        console.error('❌ Failed to delete service:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Service soft deleted:', serviceId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting service:', error);
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
    console.log('🗑️ HARD deleting service:', serviceId);

    try {
      const supabase = createClient() as any;

      const { error } = await supabase
        .from('business_services')
        .delete()
        .eq('id', serviceId);

      if (error) {
        console.error('❌ Failed to hard delete service:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Service permanently deleted:', serviceId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error hard deleting service:', error);
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
    console.log(
      '📦 Creating services for onboarding:',
      businessId,
      services.length
    );

    try {
      const supabase = createClient() as any;

      // Filter out empty services
      const validServices = services.filter(
        service => service.name.trim() !== ''
      );

      if (validServices.length === 0) {
        console.log('ℹ️ No valid services to create');
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
        .insert(servicesData)
        .select();

      if (error) {
        console.error('❌ Failed to create services:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Services created for onboarding:', data.length);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error creating services for onboarding:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to create services',
      };
    }
  }
}
