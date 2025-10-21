/**
 * Debug HEIC Upload Component
 *
 * This component can be temporarily added to help debug HEIC upload issues.
 * It shows detailed information about the upload process.
 */

import React, { useState } from 'react';
import { HeicConverterService } from './heic-converter.service';

interface DebugHeicUploadProps {
  onFileSelect: (file: File) => void;
}

export const DebugHeicUpload: React.FC<DebugHeicUploadProps> = ({
  onFileSelect,
}) => {
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${info}`,
    ]);
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    addDebugInfo(
      `File selected: ${file.name} (${file.type}, ${file.size} bytes)`
    );

    // Test HEIC detection
    const isHeic = HeicConverterService.isHeicFile(file);
    addDebugInfo(`Is HEIC file: ${isHeic}`);

    if (isHeic) {
      addDebugInfo('Testing HEIC conversion...');
      try {
        const result = await HeicConverterService.convertToJpeg(file);
        if (result.success && result.jpegFile) {
          addDebugInfo(
            `Conversion successful: ${result.jpegFile.name} (${result.jpegFile.type}, ${result.jpegFile.size} bytes)`
          );
        } else {
          addDebugInfo(`Conversion failed: ${result.error}`);
        }
      } catch (error) {
        addDebugInfo(`Conversion error: ${error}`);
      }
    }

    onFileSelect(file);
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Debug HEIC Upload</h3>

      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="mb-4"
      />

      <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-64 overflow-y-auto">
        {debugInfo.map((info, index) => (
          <div key={index}>{info}</div>
        ))}
      </div>
    </div>
  );
};
