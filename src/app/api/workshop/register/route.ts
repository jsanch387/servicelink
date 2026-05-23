import { parseWorkshopAttributionFromBody } from '@/features/ads-workshop/server/parseWorkshopAttribution';
import { saveWorkshopLead } from '@/features/ads-workshop/server/saveWorkshopLead';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const email = typeof body.email === 'string' ? body.email : '';
    const attribution = parseWorkshopAttributionFromBody(body);
    const result = await saveWorkshopLead(email, attribution);

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({ success: true, leadId: result.leadId });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );
  }
}
