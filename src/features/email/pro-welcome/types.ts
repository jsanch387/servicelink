export interface ProWelcomeEmailPayload {
  /** Owner first name for a personal greeting; falls back to a generic hello. */
  firstName?: string;
  /** Absolute URL to the Meta ads workshop (gate page). */
  workshopUrl: string;
}

export interface SendProWelcomeEmailResult {
  sent: boolean;
  error?: string;
}
