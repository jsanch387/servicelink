/**
 * POST /api/stripe/webhook-connect
 *
 * Dedicated endpoint for Stripe Connected Account events.
 * Reuses the main webhook handler logic, but verifies signatures with
 * `STRIPE_CONNECT_WEBHOOK_SECRET` first.
 */
export { maxDuration, POST } from '@/app/api/stripe/webhook/route';
