/**
 * Shared cron infrastructure. Job *work* stays in the owning feature
 * (e.g. availability booking reminders). This feature owns auth, the
 * route helper, and the job catalog.
 */

export { CRON_JOBS } from './jobs';
export type { CronJob, CronJobId } from './jobs';
export { handleCronGet } from './server/handleCronGet';
export type { CronJobRunner } from './server/handleCronGet';
export { verifyInternalCronAuth } from './server/verifyInternalCronAuth';
