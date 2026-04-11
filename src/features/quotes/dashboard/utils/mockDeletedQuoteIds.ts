const STORAGE_KEY = 'bp_quotes_dashboard_mock_deleted';

function parseIds(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string');
  } catch {
    return [];
  }
}

export function getMockDeletedQuoteIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  return new Set(parseIds(sessionStorage.getItem(STORAGE_KEY)));
}

export function addMockDeletedQuoteId(id: string): void {
  if (typeof window === 'undefined') return;
  const next = new Set(parseIds(sessionStorage.getItem(STORAGE_KEY)));
  next.add(id.trim());
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
}
