export interface SendTrialEndingSoonEmailParams {
  trialEndsAtIso?: string | null;
}

export interface SendTrialEndingSoonEmailResult {
  sent: boolean;
  error?: string;
}
