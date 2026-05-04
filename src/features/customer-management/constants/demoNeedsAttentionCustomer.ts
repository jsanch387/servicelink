import type { CustomerRecord } from '@/features/customer-management/types';

export const DEMO_NEEDS_ATTENTION_CUSTOMER: CustomerRecord = {
  id: 'demo_needs_attention',
  name: 'Sample Customer',
  phone: '(555) 555-5555',
  email: 'sample@email.com',
  lastService: 'Black Label Detail',
  lastVisitDate: '2025-12-05',
  lastVisitDaysAgo: 112,
  nextAppointmentDate: null,
  nextAppointmentDaysUntil: null,
  totalVisits: 2,
  totalSpent: 770,
  maintenanceVisitsCompleted: 0,
  status: 'returning',
  note: 'Demo customer for Needs Attention flow preview.',
};
