export const VOICE_FROZEN_SERVICE = {
  name: 'Full detail',
  variant: 'Sedan',
  priceLabel: '$89',
} as const;

export const VOICE_FROZEN_ADDON = {
  id: 'ceramic-coat',
  name: 'Ceramic coat',
  priceLabel: '$149',
} as const;

export const VOICE_FROZEN_PET_HAIR_ADDON = {
  id: 'pet-hair',
  name: 'Pet hair removal',
  priceLabel: '',
} as const;

export const VOICE_FROZEN_CATALOG_PROMPT = `Frozen catalog (use these names and prices only; do not invent services):
- Service: Full detail, Sedan, $89
- Optional add-on: Ceramic coat, $149
- Optional add-on: Pet hair removal (keep id pet-hair; leave priceLabel empty)
Do not swap pet hair for ceramic. Do not add ceramic unless they said ceramic.`;
