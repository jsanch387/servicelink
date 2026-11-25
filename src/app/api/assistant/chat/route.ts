/**
 * POST /api/assistant/chat
 *
 * Ask-anything: stream a reply. No DB / history persistence yet.
 * Auth: Bearer or cookie. Requires customers.read + Pro.
 * Caps: kill switch, burst rate limit, monthly turn meter (1 per request).
 * Body: { messages: UIMessage[] } (AI SDK useChat)
 */

import { runAssistantChatPoc } from '@/features/assistant/chat/server/runAssistantChatPoc';
import { assertAssistantChatAllowed } from '@/features/assistant/server/assistantChatGuards';
import { assistantProRequiredResponse } from '@/features/assistant/server/requireAssistantPro';
import { requireBusinessPermission } from '@/features/team/server/requireBusinessPermission';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import type { UIMessage } from 'ai';
import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(request: Request) {
  let releaseTurn: (() => Promise<void>) | null = null;

  try {
    const auth = await getAuthenticatedUser(request);
    if ('error' in auth) {
      return NextResponse.json(
        {
          success: false,
          error: auth.error,
          code: auth.code,
        },
        { status: auth.status }
      );
    }

    const resolved = await requireBusinessPermission(
      auth.supabase,
      'customers.read'
    );

    if (!resolved.ok) {
      return NextResponse.json(
        {
          success: false,
          error: resolved.error,
        },
        { status: resolved.status }
      );
    }

    const proDenied = await assistantProRequiredResponse(resolved.businessId);
    if (proDenied) return proDenied;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON body',
          code: 'invalid_body',
        },
        { status: 400 }
      );
    }

    const messages = parseMessages(body);
    if (!messages) {
      return NextResponse.json(
        {
          success: false,
          error: 'Provide a messages array',
          code: 'invalid_body',
        },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Assistant chat is not configured yet.',
          code: 'chat_not_configured',
        },
        { status: 503 }
      );
    }

    const allowed = await assertAssistantChatAllowed({
      businessId: resolved.businessId,
      request,
    });
    if (!allowed.ok) return allowed.response;
    releaseTurn = allowed.release;

    return await runAssistantChatPoc({
      messages,
      businessId: resolved.businessId,
    });
  } catch (error) {
    if (releaseTurn) {
      try {
        await releaseTurn();
      } catch (releaseError) {
        console.error('[assistant:chat] turn release failed', releaseError);
      }
    }
    console.error('[assistant:chat]', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Something went wrong. Try again.',
        code: 'server_error',
      },
      { status: 500 }
    );
  }
}

function parseMessages(body: unknown): UIMessage[] | null {
  if (!body || typeof body !== 'object') return null;
  const messages = (body as { messages?: unknown }).messages;
  if (!Array.isArray(messages) || messages.length === 0) return null;
  if (messages.length > 40) return null;

  for (const message of messages) {
    if (!message || typeof message !== 'object') return null;
    const role = (message as { role?: unknown }).role;
    if (role !== 'user' && role !== 'assistant' && role !== 'system') {
      return null;
    }
  }

  return messages as UIMessage[];
}
