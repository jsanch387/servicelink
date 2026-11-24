'use client';

import {
  getBusinessBookV2CartUrl,
  getBusinessBookV2ServicesUrl,
  type PublicBookingFlowLocale,
} from '@/constants/routes';
import type { PublicActiveSale } from '@/features/marketing/types/publicActiveSale';
import type {
  AddOnForBooking,
  PriceOptionForBooking,
  ServiceForBooking,
} from '@/features/services/api/getServiceWithAddOnsForBooking';
import { BookFlowLoadingState } from '@/features/availability/booking/components/BookFlowLoadingState';
import { isJobPetComplete } from '@/features/availability/booking/utils/visitJobPets';
import type { BookingV2AssetKind } from '@/features/booking-v2/bookingV2AssetKind';
import { bookingV2ColumnClass } from '@/features/booking-v2/bookingV2Column';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import type { BookingV2Pet, BookingV2Vehicle } from '../types';
import {
  appendBookingV2CartItem,
  readBookingV2Cart,
  replaceBookingV2CartItem,
  saveBookingV2SetupItem,
} from '../utils/bookingV2Cart';
import { formatSetupDollars } from '../utils/formatSetupMoney';
import {
  computeSetupTotals,
  resolveServiceSetupVisibility,
} from '../utils/resolveServiceSetup';
import { AddOnsCard } from './AddOnsCard';
import { PricingOptionsCard } from './PricingOptionsCard';
import { RevealSection } from './RevealSection';
import { ServiceSetupFooter } from './ServiceSetupFooter';
import { ServiceSetupHeader } from './ServiceSetupHeader';
import { ServiceSetupIntro } from './ServiceSetupIntro';
import { PetFieldsCard } from './PetFieldsCard';
import { VehicleFieldsCard } from './VehicleFieldsCard';

const EMPTY_VEHICLE: BookingV2Vehicle = { year: '', make: '', model: '' };
const EMPTY_PET: BookingV2Pet = { name: '', species: '', breed: '', size: '' };

export function ServiceSetupScreen({
  businessSlug,
  bookingFlowLocale,
  service,
  priceOptions,
  addOns,
  sale,
  assetKind = 'vehicle',
  intent = 'new',
  editIndex = null,
}: {
  businessSlug: string;
  bookingFlowLocale: PublicBookingFlowLocale;
  service: ServiceForBooking;
  priceOptions: PriceOptionForBooking[];
  addOns: AddOnForBooking[];
  sale: PublicActiveSale | null;
  /** From the business type. Home and personal services skip this section. */
  assetKind?: BookingV2AssetKind;
  /** `add` appends to the visit. `edit` replaces one item. `new` starts the visit. */
  intent?: 'new' | 'add' | 'edit';
  editIndex?: number | null;
}) {
  const ui = publicBookingUi(bookingFlowLocale).bookingV2;
  const router = useRouter();
  const [editReady, setEditReady] = useState(intent !== 'edit');
  const priceOptionIds = priceOptions.map(option => option.id);
  const [selectedPriceOptionId, setSelectedPriceOptionId] = useState<
    string | null
  >(priceOptions.length === 1 ? priceOptions[0].id : null);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
  const [vehicle, setVehicle] = useState<BookingV2Vehicle>(EMPTY_VEHICLE);
  const [pet, setPet] = useState<BookingV2Pet>(EMPTY_PET);
  const [assetReady, setAssetReady] = useState(
    () => priceOptions.length <= 1 && addOns.length === 0
  );
  const collectsAsset = assetKind !== 'none';

  const visibility = resolveServiceSetupVisibility({
    priceOptionIds,
    addOnCount: addOns.length,
    selectedPriceOptionId,
    collectsAsset,
  });

  useEffect(() => {
    if (intent !== 'edit' || editIndex == null) return;
    const item = readBookingV2Cart(businessSlug).items[editIndex];
    if (item && item.serviceId === service.id) {
      const optionStillThere = priceOptions.some(
        option => option.id === item.priceOptionId
      );
      setSelectedPriceOptionId(
        optionStillThere
          ? item.priceOptionId
          : priceOptions.length === 1
            ? priceOptions[0].id
            : null
      );
      setSelectedAddOnIds(
        item.addOnIds.filter(id => addOns.some(addOn => addOn.id === id))
      );
      setVehicle(assetKind === 'vehicle' ? item.vehicle : EMPTY_VEHICLE);
      setPet(item.pet ?? EMPTY_PET);
    }
    setEditReady(true);
  }, [
    intent,
    editIndex,
    businessSlug,
    service.id,
    priceOptions,
    addOns,
    assetKind,
  ]);

  useEffect(() => {
    if (intent === 'edit') {
      setAssetReady(visibility.showVehicle);
      return;
    }
    if (!visibility.showVehicle) {
      setAssetReady(false);
      return;
    }
    if (!visibility.showAddOns) {
      setAssetReady(true);
      return;
    }
    const id = window.setTimeout(() => setAssetReady(true), 220);
    return () => window.clearTimeout(id);
  }, [intent, visibility.showVehicle, visibility.showAddOns]);

  const selectedOption =
    priceOptions.find(option => option.id === selectedPriceOptionId) ?? null;
  const totals = useMemo(
    () =>
      computeSetupTotals({
        basePriceCents: selectedOption?.priceCents ?? service.priceCents,
        baseDurationMinutes:
          selectedOption?.durationMinutes ??
          Math.max(1, service.durationMinutes),
        addOns,
        selectedAddOnIds,
        sale,
      }),
    [selectedOption, service, addOns, selectedAddOnIds, sale]
  );

  const year = vehicle.year.trim();
  const make = vehicle.make.trim();
  const model = vehicle.model.trim();
  const assetComplete =
    assetKind === 'pet'
      ? isJobPetComplete(pet)
      : assetKind === 'none'
        ? true
        : year.length > 0 && make.length > 0 && model.length > 0;
  const canAdd =
    assetKind === 'none' ? visibility.showFooter : assetReady && assetComplete;

  const offLabel =
    sale && totals.dueCents < totals.originalCents
      ? sale.discountType === 'percentage'
        ? ui.percentOff(sale.discountValue)
        : ui.amountOff(
            formatSetupDollars(totals.originalCents - totals.dueCents)
          )
      : null;

  const handleAdd = () => {
    if (!canAdd) return;
    const item = {
      serviceId: service.id,
      serviceName: service.name,
      priceOptionId: selectedOption?.id ?? null,
      priceOptionLabel: selectedOption?.label ?? null,
      addOnIds: selectedAddOnIds,
      addOns: addOns
        .filter(addOn => selectedAddOnIds.includes(addOn.id))
        .map(addOn => ({
          id: addOn.id,
          name: addOn.name,
          priceCents: addOn.priceCents,
        })),
      vehicle: assetKind === 'vehicle' ? { year, make, model } : EMPTY_VEHICLE,
      pet: assetKind === 'pet' ? pet : undefined,
      dueCents: totals.dueCents,
      originalCents: totals.originalCents,
      durationMinutes: totals.durationMinutes,
    };
    if (intent === 'edit' && editIndex != null) {
      replaceBookingV2CartItem(businessSlug, editIndex, item);
    } else if (intent === 'add') {
      appendBookingV2CartItem(businessSlug, item);
    } else {
      saveBookingV2SetupItem(businessSlug, item);
    }
    router.push(
      getBusinessBookV2CartUrl(businessSlug, { lang: bookingFlowLocale })
    );
  };

  if (!editReady) return <BookFlowLoadingState />;

  const backHref =
    intent === 'add'
      ? getBusinessBookV2ServicesUrl(businessSlug, { lang: bookingFlowLocale })
      : intent === 'edit'
        ? getBusinessBookV2CartUrl(businessSlug, { lang: bookingFlowLocale })
        : undefined;

  return (
    <div
      className={`${bookingV2ColumnClass} flex min-h-screen flex-col bg-[#0F0F0F] text-white`}
    >
      <ServiceSetupHeader
        businessSlug={businessSlug}
        bookingFlowLocale={bookingFlowLocale}
        backHref={backHref}
        backLabel={backHref ? ui.back : undefined}
      />
      <main className="flex flex-1 flex-col gap-7 px-5 pb-36 pt-7">
        <ServiceSetupIntro
          name={service.name}
          description={service.description}
          bookingFlowLocale={bookingFlowLocale}
        />
        {visibility.showPricing ? (
          <PricingOptionsCard
            options={priceOptions}
            selectedId={selectedPriceOptionId}
            onSelect={setSelectedPriceOptionId}
            bookingFlowLocale={bookingFlowLocale}
          />
        ) : null}
        {visibility.showAddOns ? (
          <RevealSection>
            <AddOnsCard
              addOns={addOns}
              selectedIds={selectedAddOnIds}
              onToggle={id =>
                setSelectedAddOnIds(current =>
                  current.includes(id)
                    ? current.filter(existing => existing !== id)
                    : [...current, id]
                )
              }
              bookingFlowLocale={bookingFlowLocale}
            />
          </RevealSection>
        ) : null}
        {visibility.showVehicle && assetReady && assetKind === 'vehicle' ? (
          <RevealSection delayMs={visibility.showAddOns ? 40 : 0}>
            <VehicleFieldsCard
              value={vehicle}
              onChange={setVehicle}
              bookingFlowLocale={bookingFlowLocale}
            />
          </RevealSection>
        ) : null}
        {visibility.showVehicle && assetReady && assetKind === 'pet' ? (
          <RevealSection delayMs={visibility.showAddOns ? 40 : 0}>
            <PetFieldsCard
              value={pet}
              onChange={setPet}
              bookingFlowLocale={bookingFlowLocale}
            />
          </RevealSection>
        ) : null}
      </main>
      {visibility.showFooter ? (
        <ServiceSetupFooter
          dueCents={totals.dueCents}
          originalCents={totals.originalCents}
          durationMinutes={totals.durationMinutes}
          offLabel={offLabel}
          canAdd={canAdd}
          onAdd={handleAdd}
          actionLabel={intent === 'edit' ? ui.saveChanges : ui.addToBooking}
          bookingFlowLocale={bookingFlowLocale}
        />
      ) : null}
    </div>
  );
}
