/** Display name for support emails when the user did not provide one. */
export function resolveContactDisplayNameFromEmail(email: string): string {
  const local = email.split('@')[0]?.trim();
  return local || 'Contact form';
}
