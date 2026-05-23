import { markWorkshopLeadConverted } from '@/features/ads-workshop/server/markWorkshopLeadConverted';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string;
      userId?: string;
      leadId?: string;
    };

    const result = await markWorkshopLeadConverted({
      email: typeof body.email === 'string' ? body.email : undefined,
      userId: typeof body.userId === 'string' ? body.userId : undefined,
      leadId: typeof body.leadId === 'string' ? body.leadId : undefined,
    });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({ success: true, matched: result.matched });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );
  }
}
