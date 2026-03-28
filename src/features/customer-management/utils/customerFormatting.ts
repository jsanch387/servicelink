export function formatCustomerCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCustomerCount(value: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(value);
}

function digitsOnlyPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/** Strip trailing extension so dial digits stay the main number only. */
function splitPhoneExtension(phone: string): {
  body: string;
  ext: string | null;
} {
  const raw = phone.trim();
  if (!raw) return { body: '', ext: null };

  const match = raw.match(
    /^(.*?)(?:\s*[;,|]?\s*|\s+)(?:ext\.?|extension|#)\s*(\d{1,8})\s*$/i
  );
  if (match?.[1]?.trim()) {
    return { body: match[1].trim(), ext: match[2] ?? null };
  }

  const xMatch = raw.match(/^(.*?)\s+[xX]\s*(\d{1,8})\s*$/);
  if (xMatch?.[1]?.trim()) {
    return { body: xMatch[1].trim(), ext: xMatch[2] ?? null };
  }

  const xTight = raw.match(/^(.+\d)[xX](\d{1,8})\s*$/);
  if (xTight?.[1]?.trim()) {
    return { body: xTight[1].trim(), ext: xTight[2] ?? null };
  }

  return { body: raw, ext: null };
}

/** Group digits as XXX XXX XXX … (chunks of 3 from the right) for readability. */
function groupDigitsLoose(digits: string): string {
  if (digits.length <= 4) return digits;
  const parts: string[] = [];
  let i = digits.length;
  while (i > 0) {
    const start = Math.max(0, i - 3);
    parts.unshift(digits.slice(start, i));
    i = start;
  }
  return parts.join(' ');
}

function formatMainNumber(body: string, digits: string): string {
  const leadingPlus = /^\s*\+/.test(body);

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
  if (digits.length > 0) {
    const grouped = groupDigitsLoose(digits);
    return leadingPlus ? `+${grouped}` : grouped;
  }

  return body.trim();
}

/**
 * Human-friendly phone for UI (customer detail, lists).
 * US 10/11-digit numbers use (000) 000-0000 / +1 (000) 000-0000; extensions shown as "ext. 123".
 */
export function formatCustomerPhone(phone: string): string {
  const { body, ext } = splitPhoneExtension(phone);
  if (!body) return phone.trim();

  const digits = digitsOnlyPhone(body);
  const main = formatMainNumber(body, digits);
  if (ext) {
    return `${main} · ext. ${ext}`;
  }
  return main;
}

export function customerPhoneHref(phone: string): string | null {
  const { body } = splitPhoneExtension(phone);
  const digits = digitsOnlyPhone(body);
  if (!digits) {
    return null;
  }
  return `tel:${digits}`;
}
