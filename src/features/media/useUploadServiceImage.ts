import { useCallback, useState } from 'react';
import { MediaService } from './media.service';
import {
  MediaUploadState,
  ServiceImageUploadData,
  UploadResult,
} from './media.types';

export function useUploadServiceImage() {
  const [state, setState] = useState<MediaUploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    result: null,
  });

  const uploadServiceImage = useCallback(
    async (data: ServiceImageUploadData): Promise<UploadResult> => {
      setState({
        isUploading: true,
        progress: 0,
        error: null,
        result: null,
      });

      try {
        const result = await MediaService.uploadServiceImage(data);
        setState({
          isUploading: false,
          progress: 100,
          error: result.success ? null : result.error || 'Upload failed',
          result,
        });
        return result;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Upload failed';
        setState({
          isUploading: false,
          progress: 0,
          error: message,
          result: null,
        });
        return { success: false, error: message };
      }
    },
    []
  );

  const removeServiceImage = useCallback(
    async (
      businessId: string,
      serviceId: string,
      previousPath?: string | null
    ): Promise<{ success: boolean; error?: string }> => {
      setState(prev => ({ ...prev, isUploading: true, error: null }));
      const result = await MediaService.removeServiceImage(
        businessId,
        serviceId,
        previousPath
      );
      setState({
        isUploading: false,
        progress: result.success ? 100 : 0,
        error: result.success ? null : result.error || 'Remove failed',
        result: null,
      });
      return result;
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
    uploadServiceImage,
    removeServiceImage,
    reset,
  };
}
