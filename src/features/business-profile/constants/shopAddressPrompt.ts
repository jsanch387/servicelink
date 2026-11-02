export const SHOP_ADDRESS_SESSION_SKIP_KEY_PREFIX =
  'servicelink:shop-address-skip:';

export function shopAddressSessionSkipKey(businessProfileId: string): string {
  return `${SHOP_ADDRESS_SESSION_SKIP_KEY_PREFIX}${businessProfileId}`;
}

export const SHOP_ADDRESS_FIELD_ID = 'profile-shop-address';
export const SHOP_ADDRESS_FOCUS_QUERY = 'shop-address';
