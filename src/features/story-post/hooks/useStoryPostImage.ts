'use client';

import { toPng } from 'html-to-image';
import { useCallback, useState } from 'react';

export function useStoryPostImage() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateImage = useCallback(async (node: HTMLElement | null) => {
    if (!node) return null;
    setIsGenerating(true);
    try {
      const dataUrl = await toPng(node, {
        cacheBust: true,
        width: 1080,
        height: 1920,
        quality: 1,
      });
      return dataUrl;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return { generateImage, isGenerating };
}
