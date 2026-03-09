/**
 * Add-ons feature - actions and types for client use.
 * getAddOns is server-only; import from @/features/services.
 */

export { createAddOnAction } from './actions/createAddOn';
export type { CreateAddOnPayload, CreateAddOnResult } from './api/createAddOn';
