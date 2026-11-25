import { ASSISTANT_CHAT_POC_SYSTEM_PROMPT } from '@/features/assistant/chat/constants/assistantChatPrompt';
import { buildAssistantChatTools } from '@/features/assistant/chat/tools/buildAssistantChatTools';
import { openai } from '@ai-sdk/openai';
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  type UIMessage,
} from 'ai';

const POC_MODEL = process.env.ASSISTANT_CHAT_MODEL?.trim() || 'gpt-4o-mini';

export async function runAssistantChatPoc(args: {
  messages: UIMessage[];
  businessId: string;
}): Promise<Response> {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    return Response.json(
      {
        success: false,
        error: 'Assistant chat is not configured yet.',
        code: 'chat_not_configured',
      },
      { status: 503 }
    );
  }

  const modelMessages = await convertToModelMessages(args.messages);
  const tools = buildAssistantChatTools({ businessId: args.businessId });

  const result = streamText({
    model: openai(POC_MODEL),
    system: ASSISTANT_CHAT_POC_SYSTEM_PROMPT,
    messages: modelMessages,
    tools,
    stopWhen: isStepCount(8),
  });

  return createUIMessageStreamResponse({
    stream: result.toUIMessageStream(),
  });
}
