/**
 * When true, businesses can dismiss the service-area prompt for the current
 * browser session ("I'll add it later"). Next visit / new session shows it again
 * until they confirm. Flip to false to make the prompt blocking.
 */
export const SERVICE_AREA_PROMPT_DISMISSIBLE = true;

export const SERVICE_AREA_SESSION_SKIP_KEY_PREFIX =
  'servicelink:service-area-skip:';

export function serviceAreaSessionSkipKey(businessProfileId: string): string {
  return `${SERVICE_AREA_SESSION_SKIP_KEY_PREFIX}${businessProfileId}`;
}
