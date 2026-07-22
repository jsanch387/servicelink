import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/libs/supabase/client';

export type RequestAccountEmailChangeResult =
  | { ok: true; pendingEmail: string }
  | {
      ok: false;
      code: 'INVALID_EMAIL' | 'SAME_EMAIL' | 'UPDATE_FAILED' | 'EMAIL_IN_USE';
      error: string;
    };

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Self-service email change for the authenticated user.
 * Sends Supabase confirmation link(s); does not apply the change until confirmed.
 */
export async function requestAccountEmailChange({
  supabase,
  currentEmail,
  newEmail,
  emailRedirectTo,
}: {
  supabase: SupabaseClient<Database>;
  currentEmail: string | null | undefined;
  newEmail: string;
  emailRedirectTo: string;
}): Promise<RequestAccountEmailChangeResult> {
  const email = normalizeEmail(newEmail);
  const current = normalizeEmail(currentEmail ?? '');

  if (!email || !isValidEmail(email)) {
    return {
      ok: false,
      code: 'INVALID_EMAIL',
      error: 'Enter a valid email address.',
    };
  }

  if (current && email === current) {
    return {
      ok: false,
      code: 'SAME_EMAIL',
      error: 'That is already your current email.',
    };
  }

  const { error } = await supabase.auth.updateUser(
    { email },
    { emailRedirectTo }
  );

  if (error) {
    const message = error.message || 'Could not update email.';
    const lower = message.toLowerCase();
    if (
      lower.includes('already') ||
      lower.includes('registered') ||
      lower.includes('exists')
    ) {
      return {
        ok: false,
        code: 'EMAIL_IN_USE',
        error: 'That email is already in use by another account.',
      };
    }
    return { ok: false, code: 'UPDATE_FAILED', error: message };
  }

  return { ok: true, pendingEmail: email };
}
