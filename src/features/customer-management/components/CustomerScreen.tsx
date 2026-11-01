'use client';

import { isVehicleRelatedBusinessType } from '@/constants/businessTypes';
import { Button, Modal } from '@/components/shared';
import {
  ROUTES,
  getOwnerCreateAppointmentForCustomerPath,
} from '@/constants/routes';
import { deleteCustomerById } from '@/features/customer-management/api/deleteCustomer';
import { deleteCustomerVehicle } from '@/features/customer-management/api/deleteCustomerVehicle';
import { fetchCustomerVehicles } from '@/features/customer-management/api/fetchCustomerVehicles';
import { fetchCustomerVisits } from '@/features/customer-management/api/fetchCustomerVisits';
import { fetchCustomersList } from '@/features/customer-management/api/fetchCustomers';
import { updateCustomerNote } from '@/features/customer-management/api/updateCustomerNote';
import { DEMO_NEEDS_ATTENTION_CUSTOMER } from '@/features/customer-management/constants/demoNeedsAttentionCustomer';
import type {
  CustomerAddress,
  CustomerRecord,
  CustomerVisit,
} from '@/features/customer-management/types';
import { isCustomerNeedsAttention } from '@/features/customer-management/utils/customerAttention';
import {
  customerPhoneHref,
  formatCustomerCurrency,
  formatCustomerPhone,
} from '@/features/customer-management/utils/customerFormatting';
import { useDashboardAccess } from '@/features/dashboard/context/DashboardAccessContext';
import {
  formatCustomerListDate,
  formatCustomerVisitAgo,
} from '@/features/customer-management/utils/customerListPresentation';
import { formatNextAppointmentRelativeDay } from '@/features/customer-management/utils/formatNextInDays';
import { customerVisitServiceLabel } from '@/features/customer-management/utils/customerVisitServiceLabel';
import { customerProfileHistoryRows } from '@/features/customer-management/utils/customerProfileHistory';
import { formatCustomerAddress } from '@/features/customer-management/utils/parseCustomerContactFields';
import type { CustomerVehicle } from '@/features/customer-management/utils/mapCustomerVehicleRows';
import { buildSmsOpenHref } from '@/features/customer-management/utils/smsLink';
import {
  ChatBubbleLeftIcon,
  ChevronLeftIcon,
  ClipboardDocumentIcon,
  EllipsisHorizontalIcon,
  EnvelopeIcon,
  PencilSquareIcon,
  PhoneIcon,
  PlusIcon,
  TrashIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import { DeleteCustomerModalBody } from './DeleteCustomerModalBody';
import { EditCustomerPanel } from './EditCustomerPanel';
import { RemoveVehicleModalBody } from './RemoveVehicleModalBody';
import { AddVehicleModalBody } from './AddVehicleModalBody';
import {
  AddCustomerContactModalBody,
  type ContactSheetKind,
} from './AddCustomerContactModalBody';

const DEMO_CUSTOMER_ID_PREFIX = 'demo_';

interface CustomerScreenProps {
  customerId: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return `${first}${last}`.toUpperCase() || '?';
}

function historyDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function statusLabel(customer: CustomerRecord): {
  label: string;
  className: string;
} {
  if (isCustomerNeedsAttention(customer)) {
    return { label: 'Due', className: 'text-amber-300' };
  }
  if (customer.status === 'returning') {
    return { label: 'Returning', className: 'text-emerald-400' };
  }
  return { label: 'New', className: 'text-white/60' };
}

function visitFromSummary(customer: CustomerRecord): CustomerVisit[] {
  if (!customer.lastVisitDate) return [];
  return [
    {
      id: `${customer.id}:last`,
      scheduledDate: customer.lastVisitDate,
      serviceName: customerVisitServiceLabel(customer.lastService),
      price:
        typeof customer.lastServicePrice === 'number'
          ? customer.lastServicePrice
          : null,
    },
  ];
}

function messageHref(customer: CustomerRecord): string | null {
  return buildSmsOpenHref(customer.phone);
}

function Surface({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.08] bg-white/[0.03] ${className}`}
    >
      {children}
    </div>
  );
}

function MoreMenu({
  callHref,
  messageHref: smsHref,
  emailHref,
  canWrite,
  onEdit,
  onDelete,
}: {
  callHref: string | null;
  messageHref: string | null;
  emailHref: string | null;
  canWrite: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-label="More"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(value => !value)}
        className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-[10px] border border-white/[0.08] bg-white/[0.03] text-white"
      >
        <EllipsisHorizontalIcon className="h-5 w-5" aria-hidden />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-44 rounded-[10px] border border-white/[0.08] bg-[#161616] p-1 shadow-xl"
        >
          <MenuLink
            href={callHref}
            icon={<PhoneIcon className="h-4 w-4" aria-hidden />}
            label="Call"
            onOpen={close}
          />
          <MenuLink
            href={smsHref}
            icon={<ChatBubbleLeftIcon className="h-4 w-4" aria-hidden />}
            label="Message"
            onOpen={close}
          />
          <MenuLink
            href={emailHref}
            icon={<EnvelopeIcon className="h-4 w-4" aria-hidden />}
            label="Email"
            onOpen={close}
          />
          {canWrite ? (
            <>
              <div
                className="mx-2 my-1 border-t border-white/[0.08]"
                role="separator"
              />
              <MenuButton
                icon={<PencilSquareIcon className="h-4 w-4" aria-hidden />}
                label="Edit"
                onClick={() => {
                  close();
                  onEdit();
                }}
              />
              <MenuButton
                icon={<TrashIcon className="h-4 w-4" aria-hidden />}
                label="Delete"
                danger
                onClick={() => {
                  close();
                  onDelete();
                }}
              />
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MenuLink({
  href,
  icon,
  label,
  onOpen,
}: {
  href: string | null;
  icon: React.ReactNode;
  label: string;
  onOpen: () => void;
}) {
  const className =
    'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-white hover:bg-white/[0.06]';
  if (!href) {
    return (
      <span
        className={`${className} cursor-not-allowed text-white/40 hover:bg-transparent`}
      >
        {icon}
        {label}
      </span>
    );
  }
  return (
    <a
      role="menuitem"
      href={href}
      className={`${className} cursor-pointer`}
      onClick={event => {
        event.preventDefault();
        onOpen();
        window.location.assign(href);
      }}
    >
      {icon}
      {label}
    </a>
  );
}

function MenuButton({
  icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-white/[0.06] ${danger ? 'text-red-300' : 'text-white'}`}
    >
      {icon}
      {label}
    </button>
  );
}

export const CustomerScreen: React.FC<CustomerScreenProps> = ({
  customerId,
}) => {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading'
  );
  const [customer, setCustomer] = useState<CustomerRecord | null>(null);
  const [visits, setVisits] = useState<CustomerVisit[]>([]);
  const [visitsLoading, setVisitsLoading] = useState(true);
  const [vehicles, setVehicles] = useState<CustomerVehicle[]>([]);
  const [showVehicles, setShowVehicles] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (customerId.startsWith(DEMO_CUSTOMER_ID_PREFIX)) {
      setCustomer(DEMO_NEEDS_ATTENTION_CUSTOMER);
      setVisits(visitFromSummary(DEMO_NEEDS_ATTENTION_CUSTOMER));
      setVisitsLoading(false);
      setVehicles([]);
      setShowVehicles(false);
      setStatus('ready');
      return;
    }

    setStatus('loading');
    setVisits([]);
    setVisitsLoading(true);
    setVehicles([]);
    setShowVehicles(false);
    void (async () => {
      const [result, visitResult] = await Promise.all([
        fetchCustomersList(),
        fetchCustomerVisits(customerId),
      ]);
      if (cancelled) return;
      if (!result.ok) {
        setStatus('error');
        return;
      }
      const match = result.customers.find(row => row.id === customerId) ?? null;
      setCustomer(match);
      if (visitResult.ok) {
        setVisits(visitResult.visits);
      } else {
        setVisits(match ? visitFromSummary(match) : []);
      }
      setVisitsLoading(false);
      const vehicleShop = isVehicleRelatedBusinessType(result.businessType);
      setShowVehicles(vehicleShop);
      if (vehicleShop) {
        const vehicleResult = await fetchCustomerVehicles(customerId);
        if (cancelled) return;
        setVehicles(vehicleResult.ok ? vehicleResult.vehicles : []);
      }
      setStatus('ready');
    })();

    return () => {
      cancelled = true;
    };
  }, [customerId]);

  return (
    <div className="w-full min-w-0 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <Link
        href={ROUTES.DASHBOARD.CUSTOMERS}
        className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-white/60 hover:text-white"
      >
        <ChevronLeftIcon className="h-4 w-4" aria-hidden />
        All customers
      </Link>

      {status === 'loading' ? <CustomerScreenSkeleton /> : null}

      {status === 'error' ? (
        <p className="mt-10 text-sm text-white/60">
          Couldn&apos;t load this customer.
        </p>
      ) : null}

      {status === 'ready' && !customer ? (
        <p className="mt-10 text-sm text-white/60">
          This customer isn&apos;t on your list.
        </p>
      ) : null}

      {status === 'ready' && customer ? (
        <CustomerProfile
          customer={customer}
          visits={visits}
          visitsLoading={visitsLoading}
          vehicles={vehicles}
          showVehicles={showVehicles}
          onVehicleAdded={vehicle => {
            setVehicles(current => [
              vehicle,
              ...current.filter(item => item.id !== vehicle.id),
            ]);
          }}
          onVehicleRemoved={vehicleId => {
            setVehicles(current =>
              current.filter(item => item.id !== vehicleId)
            );
          }}
          onContactSaved={patch => {
            setCustomer(current =>
              current ? { ...current, ...patch } : current
            );
          }}
          onProfileSaved={profile => {
            setCustomer(current =>
              current
                ? {
                    ...current,
                    name: profile.name,
                    phone: profile.phone,
                    email: profile.email,
                    address: profile.address,
                    note: profile.note,
                  }
                : current
            );
          }}
        />
      ) : null}
    </div>
  );
};

function CustomerProfile({
  customer,
  visits,
  visitsLoading,
  vehicles,
  showVehicles,
  onVehicleAdded,
  onVehicleRemoved,
  onContactSaved,
  onProfileSaved,
}: {
  customer: CustomerRecord;
  visits: CustomerVisit[];
  visitsLoading: boolean;
  vehicles: CustomerVehicle[];
  showVehicles: boolean;
  onVehicleAdded: (vehicle: CustomerVehicle) => void;
  onVehicleRemoved: (vehicleId: string) => void;
  onContactSaved: (patch: {
    phone?: string;
    email?: string;
    address?: CustomerAddress;
  }) => void;
  onProfileSaved: (profile: {
    name: string;
    phone: string;
    email: string;
    address: CustomerAddress | null;
    note: string;
  }) => void;
}) {
  const router = useRouter();
  const canWrite = useDashboardAccess().can('customers.write');
  const phone = formatCustomerPhone(customer.phone);
  const email = customer.email.trim();
  const callHref = customerPhoneHref(customer.phone);
  const status = statusLabel(customer);
  const visitCount = customer.totalVisits;
  const hasVisits = visitCount > 0;
  const avgTicket = hasVisits
    ? formatCustomerCurrency(customer.totalSpent / visitCount)
    : null;
  const lastAgo = formatCustomerVisitAgo(customer.lastVisitDaysAgo);
  const hasUpcoming = Boolean(customer.nextAppointmentDate);
  const nextAside = hasUpcoming
    ? formatNextAppointmentRelativeDay(
        customer.nextAppointmentDate,
        customer.nextAppointmentDaysUntil
      )
    : null;
  const visitAside = hasUpcoming
    ? nextAside && nextAside !== '—'
      ? nextAside
      : null
    : lastAgo;
  const featuredVisitDate = hasUpcoming
    ? customer.nextAppointmentDate
    : customer.lastVisitDate;
  const historyRows = customerProfileHistoryRows(customer, visits);
  const smsHref = messageHref(customer);
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState(customer.note);
  const [savedNote, setSavedNote] = useState(customer.note);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [addVehicleOpen, setAddVehicleOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [contactSheet, setContactSheet] = useState<ContactSheetKind | null>(
    null
  );
  const [vehicleToRemove, setVehicleToRemove] =
    useState<CustomerVehicle | null>(null);
  const [removingVehicle, setRemovingVehicle] = useState(false);
  const [removeVehicleError, setRemoveVehicleError] = useState<string | null>(
    null
  );
  const isSample = customer.id.startsWith(DEMO_CUSTOMER_ID_PREFIX);
  const canAddContact = canWrite && !isSample;
  const addressText = formatCustomerAddress(customer.address);
  const noteChanged = note.trim() !== savedNote.trim();

  useEffect(() => {
    setNote(customer.note);
    setSavedNote(customer.note);
  }, [customer.id, customer.note]);

  const copyPhone = async () => {
    if (!phone) return;
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const saveNote = async () => {
    if (isSample || !noteChanged || saving) return;
    setSaving(true);
    setSaveError(null);
    const result = await updateCustomerNote(customer.id, note);
    setSaving(false);
    if (!result.ok) {
      setSaveError(result.error);
      return;
    }
    setSavedNote(result.note);
    setNote(result.note);
  };

  const confirmDelete = async () => {
    if (deleting) return;
    if (isSample) {
      router.push(ROUTES.DASHBOARD.CUSTOMERS);
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteCustomerById(customer.id);
    if (!result.ok) {
      setDeleting(false);
      setDeleteError(result.error);
      return;
    }
    router.push(ROUTES.DASHBOARD.CUSTOMERS);
    router.refresh();
  };

  const confirmRemoveVehicle = async () => {
    if (!vehicleToRemove || removingVehicle) return;
    setRemovingVehicle(true);
    setRemoveVehicleError(null);
    const result = await deleteCustomerVehicle(customer.id, vehicleToRemove.id);
    setRemovingVehicle(false);
    if (!result.ok) {
      setRemoveVehicleError(result.error);
      return;
    }
    onVehicleRemoved(vehicleToRemove.id);
    setVehicleToRemove(null);
  };

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-sm font-semibold text-white">
            {initials(customer.name)}
          </div>
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-semibold tracking-tight text-white">
                {customer.name}
              </h1>
              <span
                className={`rounded-full bg-white/[0.08] px-2 py-0.5 text-xs font-medium ${status.className}`}
              >
                {status.label}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            href={
              isSample
                ? ROUTES.DASHBOARD.BOOKINGS_NEW
                : getOwnerCreateAppointmentForCustomerPath(customer.id)
            }
            variant="inverse"
            size="sm"
            icon={<PlusIcon className="h-4 w-4" aria-hidden />}
            className="!h-10 !min-h-10 !rounded-[10px]"
          >
            New booking
          </Button>
          <MoreMenu
            callHref={callHref}
            messageHref={smsHref}
            emailHref={email ? `mailto:${email}` : null}
            canWrite={canWrite}
            onEdit={() => setEditOpen(true)}
            onDelete={() => {
              setDeleteError(null);
              setDeleteOpen(true);
            }}
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Visits" value={String(visitCount)} />
        <Stat
          label="Lifetime spend"
          value={hasVisits ? formatCustomerCurrency(customer.totalSpent) : '—'}
        />
        <Stat label="Avg. ticket" value={avgTicket ?? '—'} />
        <Surface className="px-4 py-3">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-xs text-white/60">
              {hasUpcoming ? 'Next visit' : 'Last visit'}
            </p>
            {visitAside ? (
              <p className="text-xs text-white/60">{visitAside}</p>
            ) : null}
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
            {featuredVisitDate
              ? formatCustomerListDate(featuredVisitDate)
              : '—'}
          </p>
        </Surface>
      </div>

      <div className="mt-8 grid items-stretch gap-x-6 gap-y-8 lg:grid-cols-[minmax(0,1fr)_32rem]">
        <section className="flex flex-col lg:h-full">
          <h2 className="text-sm font-semibold text-white">Service history</h2>
          <Surface className="mt-3 flex flex-col overflow-hidden lg:grid lg:min-h-0 lg:flex-1 lg:grid-rows-3">
            {visitsLoading ? (
              <div className="px-4 py-4">
                <div className="h-5 animate-pulse rounded-lg bg-white/10" />
              </div>
            ) : historyRows.length > 0 ? (
              historyRows.map((visit, index) => (
                <div
                  key={visit.id}
                  className={`flex w-full items-center gap-3 px-4 py-4 lg:h-full lg:gap-4 lg:py-0 ${
                    index < historyRows.length - 1
                      ? 'border-b border-white/[0.08]'
                      : ''
                  }`}
                >
                  <span className="shrink-0 whitespace-nowrap text-sm text-white/60 lg:w-28">
                    {historyDate(visit.scheduledDate)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">
                    {visit.serviceName}
                  </span>
                  <span className="shrink-0 text-sm tabular-nums text-white">
                    {typeof visit.price === 'number'
                      ? formatCustomerCurrency(visit.price)
                      : '—'}
                  </span>
                </div>
              ))
            ) : (
              <p className="px-4 py-4 text-sm text-white/60">No visits yet</p>
            )}
          </Surface>
        </section>

        <section className="flex h-full flex-col">
          <h2 className="text-sm font-semibold text-white">Contact</h2>
          <Surface className="mt-3">
            <ContactRow
              label="Phone"
              value={phone || 'Not added'}
              muted={!phone}
              action={
                phone ? (
                  <button
                    type="button"
                    onClick={() => void copyPhone()}
                    className="inline-flex cursor-pointer items-center gap-1 text-sm text-white/60 hover:text-white"
                    aria-label="Copy phone number"
                  >
                    <ClipboardDocumentIcon className="h-4 w-4" aria-hidden />
                    {copied ? <span className="text-xs">Copied</span> : null}
                  </button>
                ) : canAddContact ? (
                  <AddFieldButton onClick={() => setContactSheet('phone')} />
                ) : null
              }
            />
            <ContactRow
              label="Email"
              value={email || 'Not added'}
              muted={!email}
              action={
                !email && canAddContact ? (
                  <AddFieldButton onClick={() => setContactSheet('email')} />
                ) : null
              }
            />
            <ContactRow
              label="Address"
              value={addressText || 'Not added'}
              muted={!addressText}
              wrap
              action={
                !addressText && canAddContact ? (
                  <AddFieldButton onClick={() => setContactSheet('address')} />
                ) : null
              }
              last
            />
          </Surface>
        </section>

        {showVehicles ? (
          <section className="flex flex-col self-start lg:h-full lg:min-h-0 lg:self-stretch">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-white">Vehicles</h2>
              {canWrite ? (
                <button
                  type="button"
                  onClick={() => setAddVehicleOpen(true)}
                  className="inline-flex cursor-pointer items-center gap-1 text-sm font-normal text-white/80"
                >
                  <PlusIcon className="h-4 w-4" aria-hidden />
                  Add
                </button>
              ) : null}
            </div>
            {vehicles.length > 0 ? (
              <Surface
                className={`mt-3 flex flex-col overflow-hidden lg:min-h-0 lg:flex-1 ${
                  vehicles.length > 3
                    ? 'scrollbar-hide max-h-52 overflow-y-auto overscroll-contain lg:max-h-none'
                    : ''
                }`}
              >
                {vehicles.map((vehicle, index) => (
                  <div
                    key={vehicle.id}
                    className={`flex items-center px-4 text-sm text-white ${
                      vehicles.length > 3 ? 'py-2' : 'py-3 lg:flex-1 lg:py-0'
                    } ${
                      index < vehicles.length - 1
                        ? 'border-b border-white/[0.08]'
                        : ''
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {vehicle.label}
                    </span>
                    {canAddContact ? (
                      <button
                        type="button"
                        aria-label={`Remove ${vehicle.label}`}
                        onClick={() => {
                          setRemoveVehicleError(null);
                          setVehicleToRemove(vehicle);
                        }}
                        className="ml-auto inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center text-white/40 hover:text-red-300"
                      >
                        <TrashIcon className="h-4 w-4" aria-hidden />
                      </button>
                    ) : null}
                  </div>
                ))}
              </Surface>
            ) : (
              <Surface className="mt-3 flex min-h-44 flex-1 flex-col items-center justify-center px-6 py-8 text-center lg:min-h-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-white/60">
                  <TruckIcon className="h-4 w-4" aria-hidden />
                </div>
                <p className="mt-3 text-sm font-semibold text-white">
                  No vehicles yet
                </p>
              </Surface>
            )}
          </section>
        ) : null}

        <section className="flex h-full min-h-0 flex-col lg:col-start-2">
          <h2 className="text-sm font-semibold text-white">Notes</h2>
          <Surface className="mt-3 flex min-h-44 flex-1 flex-col overflow-hidden p-4">
            <textarea
              value={note}
              onChange={event => {
                setNote(event.target.value);
                if (saveError) setSaveError(null);
              }}
              readOnly={isSample}
              placeholder="Add a note: gate code, preferences, anything worth remembering"
              className="scrollbar-hide min-h-0 w-full flex-1 resize-none overflow-y-auto bg-transparent text-sm leading-6 text-white placeholder:text-white/40 focus:outline-none"
            />
            <div className="mt-3 flex items-center justify-end gap-3">
              {saveError ? (
                <p className="mr-auto text-sm text-red-300">{saveError}</p>
              ) : null}
              <Button
                type="button"
                variant="inverse"
                size="sm"
                className="!h-9 !min-h-9 !rounded-[10px]"
                onClick={() => void saveNote()}
                loading={saving}
                disabled={isSample || !noteChanged || saving}
              >
                Save note
              </Button>
            </div>
          </Surface>
        </section>
      </div>

      {editOpen ? (
        <EditCustomerPanel
          customer={customer}
          onClose={() => setEditOpen(false)}
          onSaved={onProfileSaved}
        />
      ) : null}

      <Modal
        isOpen={deleteOpen}
        onClose={() => {
          if (!deleting) setDeleteOpen(false);
        }}
        title="Delete customer"
        maxWidth="sm"
      >
        <DeleteCustomerModalBody
          customer={customer}
          isDeleting={deleting}
          error={deleteError}
          onConfirm={() => void confirmDelete()}
          onClose={() => setDeleteOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={addVehicleOpen}
        onClose={() => setAddVehicleOpen(false)}
        title="Add vehicle"
        maxWidth="sm"
        panelMaxHeightClass="h-[calc(100dvh-3.5rem)] max-h-[calc(100dvh-3.5rem)] sm:h-auto sm:max-h-[90vh]"
        contentClassName="flex flex-col"
      >
        <AddVehicleModalBody
          customerId={customer.id}
          onClose={() => setAddVehicleOpen(false)}
          onAdded={onVehicleAdded}
        />
      </Modal>

      <Modal
        isOpen={contactSheet !== null}
        onClose={() => setContactSheet(null)}
        title={
          contactSheet === 'phone'
            ? 'Add phone'
            : contactSheet === 'email'
              ? 'Add email'
              : 'Add address'
        }
        maxWidth="sm"
        panelMaxHeightClass="h-[calc(100dvh-3.5rem)] max-h-[calc(100dvh-3.5rem)] sm:h-auto sm:max-h-[90vh]"
        contentClassName="flex flex-col"
      >
        {contactSheet ? (
          <AddCustomerContactModalBody
            key={contactSheet}
            customerId={customer.id}
            kind={contactSheet}
            onClose={() => setContactSheet(null)}
            onSaved={onContactSaved}
          />
        ) : null}
      </Modal>

      <Modal
        isOpen={vehicleToRemove !== null}
        onClose={() => {
          if (!removingVehicle) setVehicleToRemove(null);
        }}
        title="Remove vehicle"
        maxWidth="sm"
      >
        {vehicleToRemove ? (
          <RemoveVehicleModalBody
            label={vehicleToRemove.label}
            isRemoving={removingVehicle}
            error={removeVehicleError}
            onConfirm={() => void confirmRemoveVehicle()}
            onClose={() => setVehicleToRemove(null)}
          />
        ) : null}
      </Modal>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Surface className="px-4 py-3">
      <p className="text-xs text-white/60">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-white">
        {value}
      </p>
    </Surface>
  );
}

function ContactRow({
  label,
  value,
  muted = false,
  action,
  last = false,
  wrap = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
  action?: React.ReactNode;
  last?: boolean;
  wrap?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-3 ${last ? '' : 'border-b border-white/[0.08]'}`}
    >
      <div className="min-w-0">
        <p className="text-xs text-white/60">{label}</p>
        <p
          className={`mt-0.5 text-sm ${wrap ? 'whitespace-pre-line' : 'truncate'} ${muted ? 'text-white/60' : 'text-white'}`}
        >
          {value}
        </p>
      </div>
      {action}
    </div>
  );
}

function AddFieldButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer text-sm font-medium text-white"
    >
      Add
    </button>
  );
}

function CustomerScreenSkeleton() {
  const pulse = 'animate-pulse rounded-lg bg-white/10';
  return (
    <div className="mt-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className={`h-12 w-56 ${pulse}`} />
        <div className={`h-10 w-36 ${pulse}`} />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[1, 2, 3, 4].map(item => (
          <div key={item} className={`h-20 rounded-2xl ${pulse}`} />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className={`h-40 rounded-2xl ${pulse}`} />
        <div className={`h-40 rounded-2xl ${pulse}`} />
      </div>
    </div>
  );
}
