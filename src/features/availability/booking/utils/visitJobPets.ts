import {
  isPetSizeValue,
  isPetSpeciesValue,
} from '@/features/customer-management/utils/customerAssetTypes';
import type { PublicBookingJobDraft, PublicBookingJobPetDraft } from '../types';

export const EMPTY_BOOKING_PET: PublicBookingJobPetDraft = {
  name: '',
  species: '',
  breed: '',
  size: '',
};

export function jobPetDraft(
  job: Pick<PublicBookingJobDraft, 'pet'>
): PublicBookingJobPetDraft {
  return {
    name: job.pet?.name ?? '',
    species: job.pet?.species ?? '',
    breed: job.pet?.breed ?? '',
    size: job.pet?.size ?? '',
  };
}

export function isJobPetComplete(pet: {
  name?: string | null;
  species?: string | null;
  breed?: string | null;
  size?: string | null;
}): boolean {
  const name = (pet.name ?? '').trim();
  const species = (pet.species ?? '').trim();
  const breed = (pet.breed ?? '').trim();
  const size = (pet.size ?? '').trim();
  if (!name || !species || !breed || !size) return false;
  return isPetSpeciesValue(species) && isPetSizeValue(size);
}

/** True when every visit job has a complete pet. */
export function areVisitJobPetsComplete(
  jobs: PublicBookingJobDraft[]
): boolean {
  if (jobs.length === 0) return false;
  return jobs.every(job => isJobPetComplete(jobPetDraft(job)));
}

/** First job still missing a complete pet — for actionable toast copy. */
export function firstIncompleteVisitPetJob(
  jobs: PublicBookingJobDraft[]
): PublicBookingJobDraft | null {
  return jobs.find(job => !isJobPetComplete(jobPetDraft(job))) ?? null;
}
