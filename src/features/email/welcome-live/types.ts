export interface WelcomeLiveEmailPayload {
  businessSlug: string;
}

export interface SendWelcomeLiveEmailResult {
  sent: boolean;
  error?: string;
}
