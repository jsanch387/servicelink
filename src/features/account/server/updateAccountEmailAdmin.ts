import { createSupabaseAdminClient } from '@/libs/supabase/admin';

export type UpdateAccountEmailAdminResult =
  | { ok: true; userId: string; previousEmail: string | null; email: string }
  | { ok: false; error: string };

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Admin-only: set a user's auth email immediately (no confirmation emails).
 * Use for support cases such as a typo'd signup email the user cannot access.
 */
export async function updateAccountEmailAdmin({
  userId,
  newEmail,
  emailConfirm = true,
}: {
  userId: string;
  newEmail: string;
  emailConfirm?: boolean;
}): Promise<UpdateAccountEmailAdminResult> {
  const id = userId.trim();
  const email = normalizeEmail(newEmail);

  if (!id) {
    return { ok: false, error: 'userId is required' };
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'A valid newEmail is required' };
  }

  const admin = createSupabaseAdminClient();

  const { data: before, error: lookupError } =
    await admin.auth.admin.getUserById(id);
  if (lookupError || !before.user) {
    return {
      ok: false,
      error: lookupError?.message ?? `No auth user found for id ${id}`,
    };
  }

  const previousEmail = before.user.email ?? null;
  if (previousEmail && normalizeEmail(previousEmail) === email) {
    return {
      ok: false,
      error: 'New email matches the current auth email — no change needed.',
    };
  }

  const { data, error } = await admin.auth.admin.updateUserById(id, {
    email,
    email_confirm: emailConfirm,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return {
    ok: true,
    userId: data.user.id,
    previousEmail,
    email: data.user.email ?? email,
  };
}

/**
 * Find auth user id by exact email (case-insensitive). Scans up to `maxPages`
 * listUsers pages of 1000 — enough for support scripts on small/medium projects.
 */
export async function findAuthUserIdByEmail(
  email: string,
  maxPages = 10
): Promise<string | null> {
  const target = normalizeEmail(email);
  if (!target) return null;

  const admin = createSupabaseAdminClient();

  for (let page = 1; page <= maxPages; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw new Error(error.message);

    const match = (data.users ?? []).find(
      u => u.email && normalizeEmail(u.email) === target
    );
    if (match) return match.id;

    if ((data.users ?? []).length < 1000) break;
  }

  return null;
}
