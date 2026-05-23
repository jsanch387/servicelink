import { updateWorkshopLeadFunnel } from '@/features/ads-workshop/server/updateWorkshopLeadFunnel';
import type { WorkshopFunnelEvent } from '@/features/ads-workshop/types/workshopLead';
import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_EVENTS = new Set<WorkshopFunnelEvent>([
  'video_view',
  'signup_click',
]);

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      leadId?: string;
      event?: string;
    };

    const leadId = typeof body.leadId === 'string' ? body.leadId : '';
    const event = body.event as WorkshopFunnelEvent;

    if (!leadId.trim()) {
      return NextResponse.json(
        { success: false, error: 'Lead id is required' },
        { status: 400 }
      );
    }

    if (!ALLOWED_EVENTS.has(event)) {
      return NextResponse.json(
        { success: false, error: 'Invalid event' },
        { status: 400 }
      );
    }

    const result = await updateWorkshopLeadFunnel(leadId, event);

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );
  }
}
