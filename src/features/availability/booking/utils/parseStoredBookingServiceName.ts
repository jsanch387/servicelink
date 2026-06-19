const STORED_SERVICE_NAME_SEPARATOR = ' — ';

export function parseStoredBookingServiceName(stored: string): {
  serviceName: string;
  priceOptionLabel: string | null;
} {
  const trimmed = stored.trim();
  if (!trimmed) {
    return { serviceName: 'Service', priceOptionLabel: null };
  }

  const separatorIndex = trimmed.lastIndexOf(STORED_SERVICE_NAME_SEPARATOR);
  if (separatorIndex <= 0) {
    return { serviceName: trimmed, priceOptionLabel: null };
  }

  const serviceName = trimmed.slice(0, separatorIndex).trim();
  const priceOptionLabel = trimmed
    .slice(separatorIndex + STORED_SERVICE_NAME_SEPARATOR.length)
    .trim();

  if (!serviceName || !priceOptionLabel) {
    return { serviceName: trimmed, priceOptionLabel: null };
  }

  return { serviceName, priceOptionLabel };
}

export function normalizeInvoiceSnapshotLines<
  T extends { kind: string; label: string; detailLabel?: string | null },
>(lines: T[]): T[] {
  return lines.map(line => {
    if (line.kind !== 'service' || line.detailLabel?.trim()) {
      return line;
    }

    const parsed = parseStoredBookingServiceName(line.label);
    if (!parsed.priceOptionLabel) {
      return line;
    }

    return {
      ...line,
      label: parsed.serviceName,
      detailLabel: parsed.priceOptionLabel,
    };
  });
}
