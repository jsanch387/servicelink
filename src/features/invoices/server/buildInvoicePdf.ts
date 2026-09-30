import { formatUsPhoneDigits } from '@/lib/formatUsPhone';
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from 'pdf-lib';

import type { PublicInvoiceBillModel } from '../components/PublicInvoiceBill';
import type { InvoiceStatus } from '../types';
import {
  formatInvoiceCents,
  formatInvoiceDueDate,
} from '../utils/invoiceDraft';

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 54;

const INK = rgb(0.11, 0.11, 0.11);
const MUTED = rgb(0.55, 0.53, 0.5);
const SOFT = rgb(0.36, 0.35, 0.33);
const LINE = rgb(0.925, 0.918, 0.894);
const BAND = rgb(0.957, 0.953, 0.941);

function statusLabel(status: InvoiceStatus): string {
  if (status === 'paid') return 'Paid';
  if (status === 'void') return 'Void';
  return 'Unpaid';
}

function statusColors(status: InvoiceStatus): {
  fill: ReturnType<typeof rgb>;
  text: ReturnType<typeof rgb>;
} {
  if (status === 'paid') {
    return { fill: rgb(0.906, 0.965, 0.925), text: rgb(0.114, 0.42, 0.227) };
  }
  if (status === 'void') {
    return { fill: rgb(0.945, 0.937, 0.922), text: rgb(0.435, 0.416, 0.392) };
  }
  return { fill: rgb(0.957, 0.941, 0.902), text: rgb(0.42, 0.329, 0.125) };
}

/** Helvetica only encodes WinAnsi. Keep punctuation the bill already uses. */
function pdfSafe(value: string): string {
  return value
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u00A0/g, ' ')
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, '');
}

function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number
): string[] {
  const safe = pdfSafe(text).replace(/\s+/g, ' ').trim();
  if (!safe) return [''];

  const lines: string[] = [];
  let current = '';

  const takeWord = (word: string) => {
    if (font.widthOfTextAtSize(word, size) <= maxWidth) {
      current = word;
      return;
    }
    let chunk = '';
    for (const char of word) {
      const next = chunk + char;
      if (font.widthOfTextAtSize(next, size) <= maxWidth) {
        chunk = next;
      } else {
        if (chunk) lines.push(chunk);
        chunk = char;
      }
    }
    current = chunk;
  };

  for (const word of safe.split(' ')) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = '';
      takeWord(word);
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Letter-size file of the customer bill. Same sections as the on-screen sheet.
 */
export async function buildInvoicePdf(
  invoice: PublicInvoiceBillModel
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const width = PAGE_WIDTH - MARGIN * 2;

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const newPage = () => {
    page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
  };

  const need = (height: number) => {
    if (y - height >= MARGIN) return;
    newPage();
  };

  const rule = () => {
    need(16);
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: MARGIN + width, y },
      thickness: 0.75,
      color: LINE,
    });
    y -= 22;
  };

  const phone = invoice.customerPhone
    ? formatUsPhoneDigits(invoice.customerPhone)
    : '';
  const contact = [invoice.customerEmail, phone].filter(
    (line): line is string => Boolean(line && line.trim())
  );
  const amountLabel =
    invoice.status === 'paid'
      ? 'Paid'
      : invoice.status === 'void'
        ? 'Void'
        : 'Amount due';
  const note = invoice.note?.trim() ?? '';
  const colors = statusColors(invoice.status);
  const pill = statusLabel(invoice.status);
  const pillWidth = bold.widthOfTextAtSize(pill, 9) + 16;
  const numberLabel = `INVOICE  #${invoice.invoiceNumber}`;

  page.drawText(pdfSafe(numberLabel), {
    x: MARGIN,
    y: y - 9,
    size: 9,
    font: bold,
    color: MUTED,
  });
  page.drawRectangle({
    x: MARGIN + width - pillWidth,
    y: y - 14,
    width: pillWidth,
    height: 16,
    color: colors.fill,
  });
  page.drawText(pill, {
    x: MARGIN + width - pillWidth + 8,
    y: y - 10,
    size: 9,
    font: bold,
    color: colors.text,
  });
  y -= 28;

  const nameLines = wrapText(
    invoice.businessName || 'Invoice',
    bold,
    22,
    width
  );
  for (const line of nameLines) {
    need(28);
    page.drawText(line, {
      x: MARGIN,
      y: y - 22,
      size: 22,
      font: bold,
      color: INK,
    });
    y -= 28;
  }

  y -= 10;
  rule();

  const billedName = invoice.customerName.trim() || '-';
  const billedLines = wrapText(billedName, bold, 12, width / 2 - 12);
  const due = pdfSafe(formatInvoiceDueDate(invoice.dueOn ?? ''));
  const blockTop = y;

  page.drawText('BILLED TO', {
    x: MARGIN,
    y,
    size: 8,
    font: bold,
    color: MUTED,
  });
  const dueLabelWidth = bold.widthOfTextAtSize('DUE DATE', 8);
  page.drawText('DUE DATE', {
    x: MARGIN + width - dueLabelWidth,
    y,
    size: 8,
    font: bold,
    color: MUTED,
  });
  y -= 18;

  let leftY = y;
  for (const line of billedLines) {
    page.drawText(line, {
      x: MARGIN,
      y: leftY,
      size: 12,
      font: bold,
      color: INK,
    });
    leftY -= 16;
  }
  for (const line of contact) {
    const wrapped = wrapText(line, regular, 10, width / 2 - 12);
    for (const part of wrapped) {
      page.drawText(part, {
        x: MARGIN,
        y: leftY,
        size: 10,
        font: regular,
        color: SOFT,
      });
      leftY -= 14;
    }
  }

  const dueWidth = bold.widthOfTextAtSize(due, 12);
  page.drawText(due, {
    x: MARGIN + width - dueWidth,
    y: blockTop - 18,
    size: 12,
    font: bold,
    color: INK,
  });

  y = Math.min(leftY, blockTop - 36) - 16;

  const amountRight = MARGIN + width;
  const unitRight = amountRight - 88;
  const qtyRight = unitRight - 72;
  const itemWidth = qtyRight - MARGIN - 16;

  const drawHeader = (target: PDFPage, top: number) => {
    target.drawRectangle({
      x: MARGIN,
      y: top - 18,
      width,
      height: 22,
      color: BAND,
    });
    const labelY = top - 13;
    target.drawText('ITEM', {
      x: MARGIN + 8,
      y: labelY,
      size: 8,
      font: bold,
      color: MUTED,
    });
    const qty = 'QTY';
    target.drawText(qty, {
      x: qtyRight - bold.widthOfTextAtSize(qty, 8),
      y: labelY,
      size: 8,
      font: bold,
      color: MUTED,
    });
    const unit = 'UNIT PRICE';
    target.drawText(unit, {
      x: unitRight - bold.widthOfTextAtSize(unit, 8),
      y: labelY,
      size: 8,
      font: bold,
      color: MUTED,
    });
    const amount = 'AMOUNT';
    target.drawText(amount, {
      x: amountRight - 8 - bold.widthOfTextAtSize(amount, 8),
      y: labelY,
      size: 8,
      font: bold,
      color: MUTED,
    });
  };

  need(36);
  drawHeader(page, y);
  y -= 30;

  for (const line of invoice.lines) {
    const description = wrapText(
      line.description.trim() || 'Item',
      regular,
      11,
      itemWidth
    );
    const rowHeight = Math.max(22, description.length * 14 + 10);
    if (y - rowHeight < MARGIN) {
      newPage();
      drawHeader(page, y);
      y -= 30;
    }

    let textY = y - 14;
    for (const part of description) {
      page.drawText(part, {
        x: MARGIN + 8,
        y: textY,
        size: 11,
        font: regular,
        color: INK,
      });
      textY -= 14;
    }

    const qty = String(line.quantity);
    const unit = pdfSafe(formatInvoiceCents(line.unitAmountCents));
    const amount = pdfSafe(formatInvoiceCents(line.amountCents));
    const rowMid = y - 14;
    page.drawText(qty, {
      x: qtyRight - regular.widthOfTextAtSize(qty, 11),
      y: rowMid,
      size: 11,
      font: regular,
      color: SOFT,
    });
    page.drawText(unit, {
      x: unitRight - regular.widthOfTextAtSize(unit, 11),
      y: rowMid,
      size: 11,
      font: regular,
      color: SOFT,
    });
    page.drawText(amount, {
      x: amountRight - 8 - bold.widthOfTextAtSize(amount, 11),
      y: rowMid,
      size: 11,
      font: bold,
      color: INK,
    });

    y -= rowHeight;
    page.drawLine({
      start: { x: MARGIN, y: y + 4 },
      end: { x: MARGIN + width, y: y + 4 },
      thickness: 0.5,
      color: LINE,
    });
  }

  const total = pdfSafe(formatInvoiceCents(invoice.totalCents));
  need(64);
  y -= 16;
  const totalsX = MARGIN + width - 220;
  page.drawText('Subtotal', {
    x: totalsX,
    y,
    size: 11,
    font: regular,
    color: SOFT,
  });
  page.drawText(total, {
    x: amountRight - 8 - regular.widthOfTextAtSize(total, 11),
    y,
    size: 11,
    font: regular,
    color: INK,
  });
  y -= 10;
  page.drawLine({
    start: { x: totalsX, y },
    end: { x: amountRight, y },
    thickness: 0.75,
    color: LINE,
  });
  y -= 18;
  page.drawText(amountLabel, {
    x: totalsX,
    y,
    size: 12,
    font: bold,
    color: INK,
  });
  page.drawText(total, {
    x: amountRight - 8 - bold.widthOfTextAtSize(total, 12),
    y,
    size: 12,
    font: bold,
    color: INK,
  });
  y -= 28;

  if (note) {
    need(48);
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: MARGIN + width, y },
      thickness: 0.75,
      color: LINE,
    });
    y -= 20;
    page.drawText('NOTES', {
      x: MARGIN,
      y,
      size: 8,
      font: bold,
      color: MUTED,
    });
    y -= 16;
    const noteLines = wrapText(note, regular, 11, width);
    for (const line of noteLines) {
      need(16);
      page.drawText(line, {
        x: MARGIN,
        y,
        size: 11,
        font: regular,
        color: rgb(0.247, 0.235, 0.22),
      });
      y -= 15;
    }
  }

  return doc.save();
}
