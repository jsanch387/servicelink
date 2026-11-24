import {
  parseCustomerImportCsv,
  tableFromMatrix,
  type CustomerImportTable,
} from '@/features/customer-management/utils/parseCustomerImportCsv';

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export async function readCustomerImportFile(
  file: File
): Promise<
  { ok: true; table: CustomerImportTable } | { ok: false; error: string }
> {
  if (file.size > MAX_FILE_BYTES) {
    return {
      ok: false,
      error: 'That file is too large. Use a file under 5 MB.',
    };
  }
  const name = file.name.toLowerCase();
  if (name.endsWith('.xls') && !name.endsWith('.xlsx')) {
    return {
      ok: false,
      error: 'Save this spreadsheet as .xlsx or .csv, then upload it again.',
    };
  }
  if (name.endsWith('.xlsx')) return readExcelFile(file);
  const text = await file.text();
  return parseCustomerImportCsv(text);
}

async function readExcelFile(
  file: File
): Promise<
  { ok: true; table: CustomerImportTable } | { ok: false; error: string }
> {
  try {
    const { readSheet } = await import('read-excel-file/browser');
    const rows = await readSheet(file);
    return tableFromMatrix(rows.map(row => row.map(excelCell)));
  } catch {
    return {
      ok: false,
      error:
        "We couldn't read that spreadsheet. Save it as a CSV and try again.",
    };
  }
}

function excelCell(value: unknown): string {
  if (value == null || typeof value === 'boolean') return '';
  if (value instanceof Date) return '';
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Number.isInteger(value) ? String(value) : String(value);
  }
  return String(value).trim();
}
