'use client';

import { Button, Modal, Select } from '@/components/shared';
import { importCustomersRequest } from '@/features/customer-management/api/importCustomers';
import {
  buildCustomerImportPreview,
  type CustomerImportExisting,
  type CustomerImportPreview,
} from '@/features/customer-management/utils/buildCustomerImportPreview';
import {
  CUSTOMER_IMPORT_PROMPT,
  customerImportFieldOptions,
  customerImportMappingError,
  customerImportTemplateCsv,
  isCanonicalCustomerImport,
  suggestCustomerImportMapping,
  type CustomerImportFieldId,
} from '@/features/customer-management/utils/customerImportFields';
import { type CustomerImportTable } from '@/features/customer-management/utils/parseCustomerImportCsv';
import { readCustomerImportFile } from '@/features/customer-management/utils/readCustomerImportFile';
import {
  ArrowUpTrayIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import React, { useRef, useState } from 'react';

type ImportStep = 'start' | 'map' | 'preview' | 'done';

interface ImportCustomersModalProps {
  isOpen: boolean;
  onClose: () => void;
  includeVehicles: boolean;
  existingCustomers: readonly CustomerImportExisting[];
  onImported: () => void;
}

export const ImportCustomersModal: React.FC<ImportCustomersModalProps> = ({
  isOpen,
  onClose,
  includeVehicles,
  existingCustomers,
  onImported,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<ImportStep>('start');
  const [fileName, setFileName] = useState('');
  const [table, setTable] = useState<CustomerImportTable | null>(null);
  const [mapping, setMapping] = useState<CustomerImportFieldId[]>([]);
  const [preview, setPreview] = useState<CustomerImportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{
    created: number;
    skipped: number;
    failed: number;
  } | null>(null);

  const reset = () => {
    setStep('start');
    setFileName('');
    setTable(null);
    setMapping([]);
    setPreview(null);
    setError(null);
    setCopied(false);
    setDragging(false);
    setSaving(false);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const close = () => {
    if (saving) return;
    reset();
    onClose();
  };

  const readFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    const parsed = await readCustomerImportFile(file);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    const nextMapping = suggestCustomerImportMapping(
      parsed.table.headers,
      includeVehicles
    );
    setFileName(file.name);
    setTable(parsed.table);
    setMapping(nextMapping);
    if (
      isCanonicalCustomerImport(parsed.table.headers) &&
      !customerImportMappingError(nextMapping)
    ) {
      setPreview(
        buildCustomerImportPreview(parsed.table, nextMapping, {
          existing: existingCustomers,
          includeVehicles,
        })
      );
      setStep('preview');
      return;
    }
    setStep('map');
  };

  const continueFromMap = () => {
    if (!table) return;
    const mappingError = customerImportMappingError(mapping);
    if (mappingError) {
      setError(mappingError);
      return;
    }
    setError(null);
    setPreview(
      buildCustomerImportPreview(table, mapping, {
        existing: existingCustomers,
        includeVehicles,
      })
    );
    setStep('preview');
  };

  const confirmImport = async () => {
    if (!preview || preview.ready.length === 0) return;
    setSaving(true);
    setError(null);
    const response = await importCustomersRequest(preview.ready);
    setSaving(false);
    if (!response.ok) {
      setError(response.error);
      return;
    }
    setResult(response);
    setStep('done');
    onImported();
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(CUSTOMER_IMPORT_PROMPT);
      setCopied(true);
    } catch {
      setError('Copy the prompt from the box below.');
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([customerImportTemplateCsv()], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'customer-import-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const fieldOptions = customerImportFieldOptions(includeVehicles);

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title="Import customers"
      maxWidth="lg"
      fullScreenMobile
      preventClose={saving}
    >
      {step === 'start' ? (
        <div>
          <p className="text-sm leading-6 text-white/70">
            Drop a CSV or Excel file. If it came from another system, copy the
            prompt into ChatGPT or any other chat, attach the file, and drop the
            spreadsheet you get back.
          </p>
          <p className="mt-3 text-sm leading-6 text-white/70">
            We save United States phone numbers. Other numbers are left blank.
            That chat receives your customer list. We never see the
            conversation.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void copyPrompt()}
              className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-white/30 bg-[#2c2c2c] px-3.5 text-sm text-gray-100 hover:border-white/45 hover:bg-[#343434]"
            >
              <DocumentDuplicateIcon
                className="h-4 w-4 text-gray-400"
                aria-hidden
              />
              {copied ? 'Copied' : 'Copy prompt'}
            </button>
            <button
              type="button"
              onClick={downloadTemplate}
              className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-white/30 bg-[#2c2c2c] px-3.5 text-sm text-gray-100 hover:border-white/45 hover:bg-[#343434]"
            >
              Download template
            </button>
          </div>
          <label
            className={`mt-4 flex cursor-pointer flex-col items-center rounded-2xl border border-dashed px-4 py-8 text-center ${
              dragging
                ? 'border-white/50 bg-white/[0.06]'
                : 'border-white/20 bg-white/[0.03]'
            }`}
            onDragOver={event => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={event => {
              event.preventDefault();
              setDragging(false);
              void readFile(event.dataTransfer.files[0]);
            }}
          >
            <ArrowUpTrayIcon className="h-5 w-5 text-white/60" aria-hidden />
            <span className="mt-3 text-sm font-medium text-white">
              Drop a CSV or Excel file
            </span>
            <span className="mt-1 text-sm text-white/50">or choose a file</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              aria-label="Upload a customer file"
              className="sr-only"
              onChange={event => void readFile(event.target.files?.[0])}
            />
          </label>
          {error ? <ImportError message={error} /> : null}
        </div>
      ) : null}

      {step === 'map' && table ? (
        <div>
          <p className="text-sm leading-6 text-white/70">
            Match each column in {fileName} to a customer field. Anything you
            don&apos;t need can stay on Ignore.
          </p>
          <div className="mt-4 space-y-3">
            {table.headers.map((header, index) => (
              <div
                key={`${header}-${index}`}
                className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-end"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {header}
                  </p>
                  <p className="truncate text-xs text-white/50">
                    {sampleCell(table, index) || 'Empty'}
                  </p>
                </div>
                <Select
                  label="Import as"
                  value={mapping[index] ?? 'ignore'}
                  options={fieldOptions}
                  onChange={value => {
                    setMapping(current =>
                      current.map((field, fieldIndex) =>
                        fieldIndex === index
                          ? (value as CustomerImportFieldId)
                          : field
                      )
                    );
                    setError(null);
                  }}
                />
              </div>
            ))}
          </div>
          {error ? <ImportError message={error} /> : null}
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={() => setStep('start')}>
              Back
            </Button>
            <Button variant="inverse" onClick={continueFromMap}>
              Continue
            </Button>
          </div>
        </div>
      ) : null}

      {step === 'preview' && preview ? (
        <div>
          {fileName ? (
            <p className="text-sm text-white/50">{fileName}</p>
          ) : null}
          <PreviewSummary preview={preview} />
          {error ? <ImportError message={error} /> : null}
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() =>
                setStep(
                  isCanonicalCustomerImport(table?.headers ?? [])
                    ? 'start'
                    : 'map'
                )
              }
              disabled={saving}
            >
              Back
            </Button>
            <Button
              variant="inverse"
              onClick={() => void confirmImport()}
              disabled={preview.ready.length === 0}
              loading={saving}
            >
              {preview.ready.length === 1
                ? 'Import 1 customer'
                : `Import ${preview.ready.length} customers`}
            </Button>
          </div>
        </div>
      ) : null}

      {step === 'done' && result ? (
        <div>
          <p className="text-sm leading-6 text-white">{doneSummary(result)}</p>
          <div className="mt-6 flex justify-end">
            <Button variant="inverse" onClick={close}>
              Done
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

function ImportError({ message }: { message: string }) {
  return (
    <p className="mt-4 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-200">
      {message}
    </p>
  );
}

function sampleCell(table: CustomerImportTable, index: number): string {
  for (const row of table.rows) {
    const value = (row[index] ?? '').trim();
    if (value) return value.length > 48 ? `${value.slice(0, 48)}…` : value;
  }
  return '';
}

function PreviewSummary({ preview }: { preview: CustomerImportPreview }) {
  const ready =
    preview.ready.length === 1
      ? '1 customer is ready to import.'
      : `${preview.ready.length} customers are ready to import.`;
  const duplicates =
    preview.duplicates.length === 0
      ? null
      : preview.duplicates.length === 1
        ? '1 is already on your list and will be skipped.'
        : `${preview.duplicates.length} are already on your list and will be skipped.`;
  const skipped = skippedLines(preview);

  return (
    <div className="mt-3 space-y-2">
      <p className="text-sm font-medium text-white">{ready}</p>
      {duplicates ? (
        <p className="text-sm text-white/60">{duplicates}</p>
      ) : null}
      {skipped.map(line => (
        <p key={line} className="text-sm text-white/60">
          {line}
        </p>
      ))}
      {warningLines(preview).map(line => (
        <p key={line} className="text-sm text-amber-200/90">
          {line}
        </p>
      ))}
    </div>
  );
}

function skippedLines(preview: CustomerImportPreview): string[] {
  const counts = new Map<string, number>();
  for (const row of preview.skipped) {
    counts.set(row.reason, (counts.get(row.reason) ?? 0) + 1);
  }
  return [...counts.entries()].map(([reason, count]) =>
    count === 1
      ? `1 row skipped. ${reason}`
      : `${count} rows skipped. ${reason}`
  );
}

function warningLines(preview: CustomerImportPreview): string[] {
  const counts = new Map<string, number>();
  for (const customer of preview.ready) {
    for (const warning of customer.warnings) {
      counts.set(warning, (counts.get(warning) ?? 0) + 1);
    }
  }
  return [...counts.entries()].map(([warning, count]) =>
    count === 1 ? `1 customer: ${warning}` : `${count} customers: ${warning}`
  );
}

function doneSummary(result: {
  created: number;
  skipped: number;
  failed: number;
}): string {
  if (result.created === 0 && result.failed === 0) {
    return 'Everyone in that file is already on your list.';
  }
  const created =
    result.created === 1
      ? 'Imported 1 customer.'
      : `Imported ${result.created} customers.`;
  const skipped =
    result.skipped > 0
      ? result.skipped === 1
        ? ' 1 was already on your list.'
        : ` ${result.skipped} were already on your list.`
      : '';
  const failed =
    result.failed > 0
      ? result.failed === 1
        ? ' 1 could not be saved.'
        : ` ${result.failed} could not be saved.`
      : '';
  return `${created}${skipped}${failed}`;
}
