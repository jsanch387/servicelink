import { createMaintenanceEnrollmentForOwner } from '@/features/maintenance/server/createMaintenanceEnrollmentForOwner';
import {
  getMaintenanceEnrollmentRequestId,
  logMaintenanceEnrollmentPost,
  maintenanceEnrollmentJsonResponse,
  supabaseErrorForLogs,
} from '@/features/maintenance/server/maintenanceEnrollmentRouteLog';
import { parseMaintenanceEnrollmentBody } from '@/features/maintenance/server/parseMaintenanceEnrollmentBody';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { resolveCurrentBusinessId } from '@/server/resolveCurrentBusinessId';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const requestId = getMaintenanceEnrollmentRequestId(request);

  try {
    const auth = await getAuthenticatedUser(request);
    if ('error' in auth) {
      logMaintenanceEnrollmentPost(requestId, 'warn', 'auth_failed', {
        code: auth.code,
        status: auth.status,
      });
      return maintenanceEnrollmentJsonResponse(
        requestId,
        { success: false, error: auth.error },
        auth.status
      );
    }

    const { supabase, authMethod } = auth;

    let json: unknown;
    try {
      json = await request.json();
    } catch {
      logMaintenanceEnrollmentPost(requestId, 'warn', 'invalid_json_body', {
        status: 400,
      });
      return maintenanceEnrollmentJsonResponse(
        requestId,
        { success: false, error: 'Invalid JSON body' },
        400
      );
    }

    const parsed = parseMaintenanceEnrollmentBody(json);
    if (!parsed.ok) {
      logMaintenanceEnrollmentPost(requestId, 'warn', 'validation_failed', {
        status: parsed.status,
      });
      return maintenanceEnrollmentJsonResponse(
        requestId,
        { success: false, error: parsed.error },
        parsed.status
      );
    }
    const body = parsed.data;

    let businessId: string;

    if (authMethod === 'bearer') {
      const bodyBusinessId = body.businessId || '';
      if (!bodyBusinessId) {
        logMaintenanceEnrollmentPost(requestId, 'warn', 'missing_business_id', {
          status: 400,
        });
        return maintenanceEnrollmentJsonResponse(
          requestId,
          { success: false, error: 'Business id is required' },
          400
        );
      }

      const resolved = await resolveCurrentBusinessId(supabase);
      if (!resolved.ok) {
        logMaintenanceEnrollmentPost(requestId, 'warn', 'business_resolve_failed', {
          status: resolved.status,
        });
        return maintenanceEnrollmentJsonResponse(
          requestId,
          { success: false, error: resolved.error },
          resolved.status
        );
      }

      if (resolved.businessId !== bodyBusinessId) {
        logMaintenanceEnrollmentPost(requestId, 'warn', 'business_forbidden', {
          status: 403,
        });
        return maintenanceEnrollmentJsonResponse(
          requestId,
          { success: false, error: 'Forbidden' },
          403
        );
      }

      if (body.businessSlug) {
        const { data: slugRow, error: slugError } = await supabase
          .from('business_profiles')
          .select('id, business_slug')
          .eq('id', bodyBusinessId)
          .maybeSingle();

        if (slugError || !slugRow) {
          logMaintenanceEnrollmentPost(
            requestId,
            'warn',
            'business_slug_lookup_failed',
            {
              status: 404,
              ...supabaseErrorForLogs(slugError ?? undefined),
            }
          );
          return maintenanceEnrollmentJsonResponse(
            requestId,
            { success: false, error: 'Business not found' },
            404
          );
        }

        const dbSlug = (
          slugRow as { business_slug?: string | null }
        ).business_slug?.trim();
        if (dbSlug && dbSlug !== body.businessSlug) {
          logMaintenanceEnrollmentPost(requestId, 'warn', 'business_slug_mismatch', {
            status: 400,
          });
          return maintenanceEnrollmentJsonResponse(
            requestId,
            { success: false, error: 'Invalid request' },
            400
          );
        }
      }

      businessId = bodyBusinessId;
    } else {
      const resolved = await resolveCurrentBusinessId(supabase);
      if (!resolved.ok) {
        logMaintenanceEnrollmentPost(requestId, 'warn', 'business_resolve_failed', {
          status: resolved.status,
        });
        return maintenanceEnrollmentJsonResponse(
          requestId,
          { success: false, error: resolved.error },
          resolved.status
        );
      }
      businessId = resolved.businessId;
    }

    const result = await createMaintenanceEnrollmentForOwner({
      supabase,
      businessId,
      body,
      requestId,
    });

    if (!result.ok) {
      logMaintenanceEnrollmentPost(requestId, 'warn', 'create_failed', {
        status: result.status,
      });
      return maintenanceEnrollmentJsonResponse(
        requestId,
        { success: false, error: result.error },
        result.status
      );
    }

    logMaintenanceEnrollmentPost(requestId, 'info', 'created', {
      emailSent: result.emailSent,
    });

    return maintenanceEnrollmentJsonResponse(
      requestId,
      {
        success: true,
        data: {
          id: result.enrollmentId,
          customerViewUrl: result.customerViewUrl,
          emailSent: result.emailSent,
          ...(result.notifiedEmail
            ? { notifiedEmail: result.notifiedEmail }
            : {}),
          emailError: result.emailError ?? undefined,
        },
      },
      201
    );
  } catch (err) {
    logMaintenanceEnrollmentPost(requestId, 'error', 'unexpected_error', {
      status: 500,
    });
    return maintenanceEnrollmentJsonResponse(
      requestId,
      {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : 'Failed to create maintenance enrollment',
      },
      500
    );
  }
}
