/**
 * Banner Upload Hook
 *
 * React hook for handling banner uploads with optimistic UI.
 * Provides upload state management and error handling.
 */

import { useState, useCallback } from 'react';
import { MediaService } from './media.service';
import {
  MediaUploadState,
  BannerUploadData,
  UploadResult,
} from './media.types';

export function useUploadBanner() {
  const [state, setState] = useState<MediaUploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    result: null,
  });

  const uploadBanner = useCallback(
    async (data: BannerUploadData): Promise<UploadResult> => {
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
            progress: Math.min(prev.progress + 10, 90),
          }));
        }, 100);

        const result = await MediaService.uploadBanner(data);

        clearInterval(progressInterval);

        setState({
          isUploading: false,
          progress: 100,
          error: result.success ? null : result.error || 'Upload failed',
          result,
        });

        return result;
      } catch (error) {
        setState({
          isUploading: false,
          progress: 0,
          error: error instanceof Error ? error.message : 'Upload failed',
          result: null,
        });

        return {
          success: false,
          error: error instanceof Error ? error.message : 'Upload failed',
        };
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
    uploadBanner,
    reset,
  };
}
