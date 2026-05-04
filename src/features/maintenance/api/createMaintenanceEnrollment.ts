'use client';

export interface CreateMaintenanceEnrollmentPayload {
  customerId: string;
  serviceNameSnapshot: string;
  priceCents: number;
  frequencyWeeks: number;
  durationMinutes: number;
  /** Omit or leave empty so the customer picks date/time on the public link. */
  anchorDate?: string;
  anchorTime?: string;
}

interface CreateMaintenanceEnrollmentSuccess {
  success: true;
  id: string;
  customerViewUrl: string;
  emailSent: boolean;
  /** Customer inbox that received the invite, when email was sent. */
  notifiedEmail?: string;
  emailError?: string;
}

interface CreateMaintenanceEnrollmentFailure {
  success: false;
  error: string;
}

export type CreateMaintenanceEnrollmentResult =
  | CreateMaintenanceEnrollmentSuccess
  | CreateMaintenanceEnrollmentFailure;

export async function createMaintenanceEnrollment(
  payload: CreateMaintenanceEnrollmentPayload
): Promise<CreateMaintenanceEnrollmentResult> {
  try {
    const { anchorDate, anchorTime, ...rest } = payload;
    const body: Record<string, unknown> = { ...rest };
    if (anchorDate?.trim()) {
      body.anchorDate = anchorDate.trim();
      body.anchorTime = (anchorTime ?? '').trim().slice(0, 5) || '10:00';
    }

    const res = await fetch('/api/maintenance/enrollments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as
      | {
          success?: boolean;
          data?: {
            id?: string;
            customerViewUrl?: string;
            emailSent?: boolean;
            notifiedEmail?: string;
            emailError?: string;
          };
          error?: string;
        }
      | undefined;

    if (
      !res.ok ||
      !json?.success ||
      !json?.data?.id ||
      !json?.data?.customerViewUrl
    ) {
      return {
        success: false,
        error: json?.error ?? 'Failed to enroll customer in maintenance',
      };
    }

    return {
      success: true,
      id: json.data.id,
      customerViewUrl: json.data.customerViewUrl,
      emailSent: Boolean(json.data.emailSent),
      notifiedEmail:
        typeof json.data.notifiedEmail === 'string'
          ? json.data.notifiedEmail
          : undefined,
      emailError: json.data.emailError,
    };
  } catch {
    return {
      success: false,
      error: 'Failed to enroll customer in maintenance',
    };
  }
}
