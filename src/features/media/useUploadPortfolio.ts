/**
 * Portfolio Upload Hook
 *
 * React hook for handling portfolio image uploads with optimistic UI.
 * Provides upload state management and error handling for multiple files.
 */

import { useState, useCallback } from 'react';
import { MediaService } from './media.service';
import {
  MediaUploadState,
  PortfolioUploadData,
  UploadResult,
} from './media.types';

export function useUploadPortfolio() {
  const [state, setState] = useState<MediaUploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    result: null,
  });

  const uploadPortfolio = useCallback(
    async (data: PortfolioUploadData): Promise<UploadResult[]> => {
      setState({
        isUploading: true,
        progress: 0,
        error: null,
        result: null,
      });

      try {
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setState(prev => ({
            ...prev,
            progress: Math.min(prev.progress + 5, 90),
          }));
        }, 100);

        const results = await MediaService.uploadPortfolio(data);

        clearInterval(progressInterval);

        // Check if all uploads were successful
        const allSuccessful = results.every(r => r.success);
        const failedCount = results.filter(r => !r.success).length;

        setState({
          isUploading: false,
          progress: 100,
          error: allSuccessful
            ? null
            : `${failedCount} of ${results.length} uploads failed`,
          result: allSuccessful
            ? { success: true }
            : { success: false, error: 'Some uploads failed' },
        });

        return results;
      } catch (error) {
        setState({
          isUploading: false,
          progress: 0,
          error: error instanceof Error ? error.message : 'Upload failed',
          result: null,
        });

        // Return failed results for all files
        return data.files.map(() => ({
          success: false,
          error: error instanceof Error ? error.message : 'Upload failed',
        }));
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({
      isUploading: false,
      progress: 0,
      error: null,
      result: null,
    });
  }, []);

  return {
    ...state,
    uploadPortfolio,
    reset,
  };
}
