'use client';

import React from 'react';

export const ListPagination: React.FC<{
  page: number;
  /** Known length. Omit when later pages are fetched on demand. */
  pageCount?: number;
  /** Used when `pageCount` is unknown. */
  hasNextPage?: boolean;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
}> = ({
  page,
  pageCount,
  hasNextPage = false,
  isLoading = false,
  onPageChange,
}) => {
  const currentPage = Math.max(0, page);
  const knownCount = pageCount != null;
  if (knownCount && pageCount <= 1) return null;
  if (!knownCount && currentPage === 0 && !hasNextPage) return null;

  const atStart = currentPage === 0;
  const atEnd = knownCount ? currentPage >= pageCount - 1 : !hasNextPage;
  const shownPage = knownCount
    ? Math.min(currentPage, pageCount - 1)
    : currentPage;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(0, shownPage - 1))}
        disabled={atStart || isLoading}
        className="cursor-pointer rounded-[10px] border border-white/15 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Previous
      </button>
      <span className="min-w-16 text-center text-sm text-gray-400">
        {knownCount
          ? `Page ${shownPage + 1} of ${pageCount}`
          : `Page ${shownPage + 1}`}
      </span>
      <button
        type="button"
        onClick={() =>
          onPageChange(
            knownCount ? Math.min(pageCount - 1, shownPage + 1) : shownPage + 1
          )
        }
        disabled={atEnd || isLoading}
        className="cursor-pointer rounded-[10px] border border-white/15 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
};
