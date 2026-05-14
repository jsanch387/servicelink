/**
 * Server-only: removes all business_images objects under
 * `businesses/{businessId}/` (logo, banner, portfolio) using the admin client.
 * Used during account deletion before auth user removal.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/libs/supabase/client';

import { MEDIA_CONFIG } from '../media.types';

const LOG = '[account-delete] storage';
const SUBFOLDERS = ['logo', 'banner', 'portfolio'] as const;
const LIST_PAGE_SIZE = 1000;
const REMOVE_CHUNK_SIZE = 100;

function isStorageFileRow(row: { id?: string | null; name: string }): boolean {
  if (!row.name.length) return false;
  if (row.id != null) return true;
  // Folder placeholders from list() often have id === null; our uploads always
  // use image extensions from generateStoragePath / HEIC conversion.
  return /\.(jpe?g|png|webp)$/i.test(row.name);
}

/**
 * Lists object paths (bucket-relative) under `prefix/` (no trailing slash on prefix).
 */
async function listAllObjectPaths(
  bucket: ReturnType<SupabaseClient<Database>['storage']['from']>,
  prefix: string
): Promise<{ paths: string[]; error?: string }> {
  const paths: string[] = [];
  let offset = 0;

  for (;;) {
    const { data, error } = await bucket.list(prefix, {
      limit: LIST_PAGE_SIZE,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    });

    if (error) {
      return {
        paths,
        error: error.message,
      };
    }

    if (!data?.length) {
      break;
    }

    for (const row of data) {
      if (!isStorageFileRow(row)) {
        continue;
      }
      paths.push(`${prefix}/${row.name}`);
    }

    if (data.length < LIST_PAGE_SIZE) {
      break;
    }
    offset += LIST_PAGE_SIZE;
  }

  return { paths };
}

async function removePathsInChunks(
  bucket: ReturnType<SupabaseClient<Database>['storage']['from']>,
  paths: string[]
): Promise<{ removed: number; error?: string }> {
  let removed = 0;

  for (let i = 0; i < paths.length; i += REMOVE_CHUNK_SIZE) {
    const chunk = paths.slice(i, i + REMOVE_CHUNK_SIZE);
    const { data, error } = await bucket.remove(chunk);

    if (error) {
      return { removed, error: error.message };
    }

    const n = Array.isArray(data) ? data.length : chunk.length;
    removed += n;
  }

  return { removed };
}

export async function deleteBusinessStorageOnAccountDelete(
  admin: SupabaseClient<Database>,
  businessId: string
): Promise<{ deletedObjectCount: number; warnings: string[] }> {
  const warnings: string[] = [];
  const trimmedId = businessId?.trim();

  if (!trimmedId) {
    return { deletedObjectCount: 0, warnings };
  }

  const bucket = admin.storage.from(MEDIA_CONFIG.bucketName);
  let deletedObjectCount = 0;

  for (const sub of SUBFOLDERS) {
    const prefix = `businesses/${trimmedId}/${sub}`;

    const { paths, error: listError } = await listAllObjectPaths(
      bucket,
      prefix
    );

    if (listError) {
      console.warn(`${LOG} list failed prefix=${prefix} message=${listError}`);
      warnings.push(`storage_list_failed_${sub}`);
      continue;
    }

    if (paths.length === 0) {
      continue;
    }

    const { removed, error: removeError } = await removePathsInChunks(
      bucket,
      paths
    );

    deletedObjectCount += removed;

    if (removeError) {
      console.warn(
        `${LOG} remove failed prefix=${prefix} removedBeforeError=${removed} message=${removeError}`
      );
      warnings.push(`storage_remove_failed_${sub}`);
      continue;
    }
  }

  return { deletedObjectCount, warnings };
}
