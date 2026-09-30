'use client';

import {
  Button,
  IconButton,
  Input,
  MoneyInput,
  PhoneInput,
  TextArea,
  toast,
} from '@/components/shared';
import { API_ROUTES, ROUTES } from '@/constants/routes';
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import type { InvoiceDraft, InvoiceLineDraft } from '../types';
import {
  createEmptyInvoiceDraft,
  createInvoiceLine,
} from '../utils/invoiceDraft';
import {
  parseSaveInvoiceDraft,
  parseSendInvoiceDraft,
} from '../utils/parseSaveInvoiceDraft';
import { InvoiceBillPreview } from './InvoiceBillPreview';

interface CreateInvoiceScreenProps {
  businessName: string;
  invoiceId?: string;
  initialDraft?: InvoiceDraft;
  /** Appointment this bill was opened from. Saved with the draft. */
  bookingId?: string | null;
}

const cardClassName =
  'rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 sm:p-5';

export const CreateInvoiceScreen: React.FC<CreateInvoiceScreenProps> = ({
  businessName,
  invoiceId,
  initialDraft,
  bookingId = null,
}) => {
  const router = useRouter();
  const [draft, setDraft] = useState<InvoiceDraft>(
    initialDraft ?? createEmptyInvoiceDraft
  );
  const [persistedId, setPersistedId] = useState(invoiceId ?? null);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const busy = saving || sending;

  const sendInvoice = async () => {
    if (busy) return;

    const parsed = parseSendInvoiceDraft(draft);
    if (!parsed.ok) {
      toast.error(parsed.error);
      return;
    }

    setSending(true);
    try {
      const response = await fetch(API_ROUTES.INVOICES_SEND, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...draft,
          invoiceId: persistedId,
          ...(bookingId ? { bookingId } : {}),
        }),
      });
      const json = (await response.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
        invoiceId?: string;
        emailAttempted?: boolean;
        emailSent?: boolean;
        emailError?: string | null;
        smsAttempted?: boolean;
        smsSent?: boolean;
        smsError?: string | null;
      } | null;

      if (json?.invoiceId) setPersistedId(json.invoiceId);

      if (!response.ok || !json?.success) {
        toast.error(json?.error || 'Could not send this invoice.');
        setSending(false);
        return;
      }

      const emailed = Boolean(json.emailAttempted) && Boolean(json.emailSent);
      const texted = Boolean(json.smsAttempted) && Boolean(json.smsSent);
      if (!emailed && !texted) {
        toast.error(
          json.emailError || json.smsError || 'Could not send this invoice.'
        );
        setSending(false);
        return;
      }
      if (!emailed && texted) {
        toast.warning(
          json.emailError
            ? `Invoice texted. ${json.emailError}`
            : 'Invoice texted. The email could not be sent.'
        );
      } else if (emailed && !texted && json.smsAttempted) {
        toast.warning(
          json.smsError
            ? `Invoice emailed. ${json.smsError}`
            : 'Invoice emailed. The text could not be sent.'
        );
      } else {
        toast.success('Invoice sent');
      }
      router.push(ROUTES.DASHBOARD.INVOICES);
    } catch {
      toast.error('Could not send this invoice.');
      setSending(false);
    }
  };

  const saveDraft = async () => {
    if (busy) return;

    const parsed = parseSaveInvoiceDraft(draft);
    if (!parsed.ok) {
      toast.error(parsed.error);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        persistedId ? API_ROUTES.INVOICE(persistedId) : API_ROUTES.INVOICES,
        {
          method: persistedId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...draft,
            ...(bookingId ? { bookingId } : {}),
          }),
        }
      );
      const json = (await response.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
      } | null;

      if (!response.ok || !json?.success) {
        toast.error(json?.error || 'Could not save this draft.');
        setSaving(false);
        return;
      }

      toast.success('Draft saved');
      router.push(ROUTES.DASHBOARD.INVOICES);
    } catch {
      toast.error('Could not save this draft.');
      setSaving(false);
    }
  };

  const updateLine = (id: string, patch: Partial<InvoiceLineDraft>) => {
    setDraft(current => ({
      ...current,
      lines: current.lines.map(line =>
        line.id === id ? { ...line, ...patch } : line
      ),
    }));
  };

  const addLine = () => {
    setDraft(current => ({
      ...current,
      lines: [...current.lines, createInvoiceLine(crypto.randomUUID())],
    }));
  };

  const removeLine = (id: string) => {
    setDraft(current => {
      if (current.lines.length === 1) {
        return {
          ...current,
          lines: [createInvoiceLine(current.lines[0].id)],
        };
      }
      return {
        ...current,
        lines: current.lines.filter(line => line.id !== id),
      };
    });
  };

  return (
    <main className="flex min-h-screen w-full flex-1 flex-col overflow-x-hidden bg-[var(--dashboard-bg)]">
      <div className="mx-auto w-full min-w-0 max-w-[1600px] flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-10">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={ROUTES.DASHBOARD.INVOICES}
            className="group -ml-1 inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
          >
            <ArrowLeftIcon className="h-4 w-4 shrink-0" aria-hidden />
            Invoices
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void saveDraft()}
              loading={saving}
              disabled={busy}
            >
              Save as draft
            </Button>
            <Button
              type="button"
              variant="inverse"
              size="sm"
              onClick={() => void sendInvoice()}
              loading={sending}
              disabled={busy}
            >
              Send invoice
            </Button>
          </div>
        </header>

        <div className="grid items-stretch gap-5 lg:grid-cols-2 lg:gap-8">
          <form
            className="flex min-w-0 flex-col gap-4"
            onSubmit={event => event.preventDefault()}
          >
            <section className={cardClassName}>
              <h1 className="border-b border-white/10 pb-3 text-sm font-semibold text-white">
                Invoice details
              </h1>

              <div className="mt-4">
                <p className="mb-2 text-xs font-medium text-zinc-500">
                  Billed to
                </p>
                <Input
                  id="invoice-customer-name"
                  aria-label="Customer name"
                  value={draft.customerName}
                  onChange={customerName =>
                    setDraft(current => ({ ...current, customerName }))
                  }
                  placeholder="Customer name"
                  autoComplete="name"
                />
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <PhoneInput
                    label="Phone"
                    value={draft.customerPhone}
                    onChange={customerPhone =>
                      setDraft(current => ({ ...current, customerPhone }))
                    }
                  />
                  <Input
                    id="invoice-customer-email"
                    label="Email"
                    type="email"
                    inputMode="email"
                    value={draft.customerEmail}
                    onChange={customerEmail =>
                      setDraft(current => ({ ...current, customerEmail }))
                    }
                    placeholder="name@email.com"
                    autoComplete="email"
                  />
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  We&apos;ll send this by email, phone, or both.
                </p>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="min-w-0">
                  <label
                    htmlFor="invoice-due-date"
                    className="mb-1.5 block text-left text-sm font-medium text-gray-200"
                  >
                    Due date
                  </label>
                  <div className="flex min-h-[42px] items-center rounded-lg border border-white/10 bg-white/5 px-3.5 transition-colors hover:border-white/20 focus-within:border-white/30 focus-within:ring-2 focus-within:ring-white/20">
                    <CalendarDaysIcon
                      className="mr-2.5 h-4 w-4 shrink-0 text-zinc-400"
                      aria-hidden
                    />
                    <input
                      id="invoice-due-date"
                      type="date"
                      value={draft.dueDate}
                      onChange={event =>
                        setDraft(current => ({
                          ...current,
                          dueDate: event.target.value,
                        }))
                      }
                      className="min-h-[42px] w-full min-w-0 flex-1 cursor-pointer border-0 bg-transparent py-2.5 text-base text-white outline-none [color-scheme:dark] focus:ring-0 sm:text-sm [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className={cardClassName}>
              <h2 className="border-b border-white/10 pb-3 text-sm font-semibold text-white">
                Services
              </h2>

              <div className="mt-4 hidden grid-cols-[minmax(0,1fr)_4.5rem_7.5rem_2.25rem] gap-2 px-1 text-[11px] font-medium tracking-wide text-zinc-500 uppercase sm:grid">
                <span>Item</span>
                <span>Qty</span>
                <span>Price</span>
                <span className="sr-only">Remove</span>
              </div>

              <ul className="mt-2 flex list-none flex-col">
                {draft.lines.map((line, index) => (
                  <li
                    key={line.id}
                    className="border-b border-white/[0.06] py-3 last:border-b-0"
                  >
                    <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[minmax(0,1fr)_4.5rem_7.5rem_2.25rem]">
                      <Input
                        id={`invoice-line-description-${index}`}
                        aria-label={`Item ${index + 1}`}
                        value={line.description}
                        onChange={description =>
                          updateLine(line.id, { description })
                        }
                        placeholder="Full detail"
                        className="min-w-0"
                      />
                      <Input
                        id={`invoice-line-qty-${index}`}
                        aria-label={`Qty ${index + 1}`}
                        value={line.quantity}
                        onChange={quantity =>
                          updateLine(line.id, {
                            quantity: quantity.replace(/\D/g, '').slice(0, 3),
                          })
                        }
                        inputMode="numeric"
                      />
                      <MoneyInput
                        aria-label={`Price ${index + 1}`}
                        value={line.amount}
                        onChange={amount => updateLine(line.id, { amount })}
                      />
                      <IconButton
                        icon={<TrashIcon className="h-4 w-4" />}
                        variant="ghost"
                        size="sm"
                        aria-label={
                          draft.lines.length === 1
                            ? 'Clear line'
                            : `Remove line ${index + 1}`
                        }
                        onClick={() => removeLine(line.id)}
                        className="mb-0.5 justify-self-end text-zinc-400 hover:text-red-300"
                      />
                    </div>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={addLine}
                className="mt-1 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-zinc-300 hover:text-white"
              >
                <PlusIcon className="h-4 w-4" aria-hidden />
                Add line
              </button>

              <div className="mt-5">
                <TextArea
                  label="Notes"
                  value={draft.note}
                  onChange={note => setDraft(current => ({ ...current, note }))}
                  placeholder="Add a note"
                  rows={3}
                  maxLength={500}
                />
              </div>
            </section>
          </form>

          <div className="min-w-0 lg:h-full">
            <InvoiceBillPreview businessName={businessName} draft={draft} />
          </div>
        </div>
      </div>
    </main>
  );
};
