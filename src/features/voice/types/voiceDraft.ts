export type VoiceDraftAddon = {
  id: string;
  name: string;
  priceLabel: string;
};

/** Full booking draft the phone keeps across voice turns. Always echoed whole. */
export type VoiceDraft = {
  customer: string;
  phone: string;
  service: string;
  pricing: string;
  addons: VoiceDraftAddon[];
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  address: string;
  date: string;
  time: string;
};
