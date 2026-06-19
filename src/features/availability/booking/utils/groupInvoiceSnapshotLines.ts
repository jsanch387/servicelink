import type { InvoiceSnapshotLine } from '@/features/availability/booking/server/buildInvoiceSnapshot';

export type InvoiceLineGroupId = 'service' | 'addon' | 'session_fee';

export interface InvoiceLineGroup {
  id: InvoiceLineGroupId;
  title: string;
  lines: InvoiceSnapshotLine[];
  subtotalCents: number;
}

function sumLines(lines: InvoiceSnapshotLine[]): number {
  return lines.reduce((total, line) => total + line.amountCents, 0);
}

export function groupInvoiceSnapshotLines(
  lines: InvoiceSnapshotLine[]
): InvoiceLineGroup[] {
  const service = lines.filter(line => line.kind === 'service');
  const addons = lines.filter(line => line.kind === 'addon');
  const extras = lines.filter(line => line.kind === 'session_fee');

  const groups: InvoiceLineGroup[] = [];

  if (service.length > 0) {
    groups.push({
      id: 'service',
      title: 'Service',
      lines: service,
      subtotalCents: sumLines(service),
    });
  }

  if (addons.length > 0) {
    groups.push({
      id: 'addon',
      title: addons.length === 1 ? 'Add-on' : 'Add-ons',
      lines: addons,
      subtotalCents: sumLines(addons),
    });
  }

  if (extras.length > 0) {
    groups.push({
      id: 'session_fee',
      title: extras.length === 1 ? 'Extra charge' : 'Extra charges',
      lines: extras,
      subtotalCents: sumLines(extras),
    });
  }

  return groups;
}
