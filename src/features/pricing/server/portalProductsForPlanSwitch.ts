/**
 * Prices the Team confirmation page may switch to.
 * Do not include the subscription's current price. Checkout creates that with
 * `price_data`, and the portal rejects those inline prices.
 */
export function portalProductsForPlanSwitch(input: {
  nextProductId: string;
  nextPriceId: string;
}): Array<{ product: string; prices: string[] }> {
  return [{ product: input.nextProductId, prices: [input.nextPriceId] }];
}
