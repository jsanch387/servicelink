import { CUSTOMER_IMPORT_MAX_ROWS } from '@/features/customer-management/utils/customerImportFields';

export type CustomerImportTable = {
  headers: string[];
  rows: string[][];
};

export function parseCustomerImportCsv(
  raw: string
): { ok: true; table: CustomerImportTable } | { ok: false; error: string } {
  const text = extractCsvText(raw);
  if (!text) return { ok: false, error: 'That file is empty.' };
  const delimiter = detectDelimiter(text);
  return tableFromMatrix(parseDelimited(text, delimiter));
}

export function tableFromMatrix(
  matrix: string[][]
): { ok: true; table: CustomerImportTable } | { ok: false; error: string } {
  const nonEmpty = matrix
    .map(row => row.map(cell => cell.trim()))
    .filter(row => row.some(Boolean));
  if (nonEmpty.length === 0) return { ok: false, error: 'That file is empty.' };

  let headerRow = nonEmpty[0] ?? [];
  let dataRows = nonEmpty.slice(1);
  const headerFilled = headerRow.filter(Boolean).length;
  const nextFilled = (dataRows[0] ?? []).filter(Boolean).length;
  if (headerFilled < 2 && nextFilled >= 2) {
    headerRow = dataRows[0] ?? [];
    dataRows = dataRows.slice(1);
  }

  while (headerRow.length > 0 && !headerRow[headerRow.length - 1]) {
    headerRow.pop();
  }
  if (headerRow.filter(Boolean).length === 0) {
    return { ok: false, error: 'That file needs a header row.' };
  }
  if (dataRows.length === 0) {
    return {
      ok: false,
      error: 'Add customers to the file, then upload it again.',
    };
  }
  if (dataRows.length > CUSTOMER_IMPORT_MAX_ROWS) {
    return {
      ok: false,
      error: `This file has ${dataRows.length.toLocaleString()} rows. Import up to ${CUSTOMER_IMPORT_MAX_ROWS.toLocaleString()} at a time.`,
    };
  }

  const width = headerRow.length;
  return {
    ok: true,
    table: {
      headers: headerRow.map(
        (header, index) => header || `Column ${index + 1}`
      ),
      rows: dataRows.map(row =>
        Array.from({ length: width }, (_, index) => row[index] ?? '')
      ),
    },
  };
}

function extractCsvText(raw: string): string {
  const text = raw.replace(/^\uFEFF/, '').trim();
  const fence = text.match(/```(?:csv)?\s*([\s\S]*?)```/i);
  if (fence?.[1]?.includes(',')) return fence[1].trim();
  return text;
}

function detectDelimiter(text: string): ',' | ';' | '\t' {
  const line = text.split(/\r?\n/, 1)[0] ?? '';
  const counts = { ',': 0, ';': 0, '\t': 0 };
  let quoted = false;
  for (const char of line) {
    if (char === '"') quoted = !quoted;
    else if (!quoted && char in counts) {
      counts[char as keyof typeof counts] += 1;
    }
  }
  if (counts[';'] > counts[','] && counts[';'] >= counts['\t']) return ';';
  if (counts['\t'] > counts[',']) return '\t';
  return ',';
}

function parseDelimited(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
      continue;
    }
    if (char === delimiter) {
      row.push(cell);
      cell = '';
      continue;
    }
    if (char === '\n' || char === '\r') {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }
    cell += char;
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}
