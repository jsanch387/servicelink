export type InternalPushSendPayload = {
  userId: string;
  title: string;
  body: string | null;
  data: { reference_type: string; reference_id: string };
};

export function parseInternalPushSendBody(
  json: unknown
): InternalPushSendPayload | null {
  if (!json || typeof json !== 'object') return null;
  const o = json as Record<string, unknown>;
  const userId = typeof o.userId === 'string' ? o.userId.trim() : '';
  const title = typeof o.title === 'string' ? o.title.trim() : '';
  const body =
    o.body === null || o.body === undefined
      ? null
      : typeof o.body === 'string'
        ? o.body
        : null;
  const data = o.data;
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  const reference_type =
    typeof d.reference_type === 'string' ? d.reference_type.trim() : '';
  const reference_id =
    typeof d.reference_id === 'string' ? d.reference_id.trim() : '';
  if (!userId || !title || !reference_type || !reference_id) return null;
  return {
    userId,
    title,
    body,
    data: { reference_type, reference_id },
  };
}
