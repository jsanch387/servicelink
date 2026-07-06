import crypto from 'crypto';

/** Opaque, unguessable token for GET /i/{publicToken} (32+ hex chars). */
export function generateInvoicePublicToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
