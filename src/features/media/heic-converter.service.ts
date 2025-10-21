/**
 * HEIC Converter Service
 *
 * Handles conversion of HEIC/HEIF images to JPEG format.
 * Used by both onboarding and edit profile features.
 */

export interface HeicConversionResult {
  success: boolean;
  jpegFile?: File;
  error?: string;
}

export class HeicConverterService {
  /**
   * Checks if a file is a HEIC/HEIF image
   */
  static isHeicFile(file: File): boolean {
    const heicTypes = ['image/heic', 'image/heif'];
    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();

    // Check both MIME type and file extension
    return (
      heicTypes.includes(fileType) ||
      fileName.endsWith('.heic') ||
      fileName.endsWith('.heif')
    );
  }

  /**
   * Converts a HEIC/HEIF file to JPEG format
   */
  static async convertToJpeg(file: File): Promise<HeicConversionResult> {
    try {
      // Check if file is HEIC/HEIF
      if (!this.isHeicFile(file)) {
        return {
          success: false,
          error: 'File is not a HEIC/HEIF image',
        };
      }

      // Create FormData to send to conversion API
      const formData = new FormData();
      formData.append('file', file);

      // Call the conversion API
      const response = await fetch('/api/convert-heic', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || 'HEIC conversion failed',
        };
      }

      // Get the converted JPEG data
      const jpegBlob = await response.blob();

      // Create a new File object with JPEG type
      const jpegFile = new File(
        [jpegBlob],
        file.name.replace(/\.(heic|heif)$/i, '.jpg'),
        {
          type: 'image/jpeg',
          lastModified: file.lastModified,
        }
      );

      return {
        success: true,
        jpegFile,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'HEIC conversion failed',
      };
    }
  }

  /**
   * Processes a file and converts it to JPEG if it's HEIC/HEIF
   * Returns the original file if it's already JPEG/PNG/WebP
   */
  static async processFile(file: File): Promise<HeicConversionResult> {
    console.log('🔍 Processing file:', {
      name: file.name,
      type: file.type,
      size: file.size,
      isHeic: this.isHeicFile(file),
    });

    // If it's not a HEIC file, return as-is
    if (!this.isHeicFile(file)) {
      console.log('✅ File is not HEIC, using as-is');
      return {
        success: true,
        jpegFile: file,
      };
    }

    console.log('🔄 Converting HEIC file to JPEG...');
    // Convert HEIC to JPEG
    const result = await this.convertToJpeg(file);
    console.log(
      '📸 Conversion result:',
      result.success ? 'SUCCESS' : 'FAILED',
      result.error
    );
    return result;
  }

  /**
   * Processes multiple files and converts HEIC files to JPEG
   */
  static async processFiles(files: File[]): Promise<{
    success: boolean;
    processedFiles: File[];
    errors: string[];
  }> {
    const processedFiles: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      const result = await this.processFile(file);

      if (result.success && result.jpegFile) {
        processedFiles.push(result.jpegFile);
      } else {
        errors.push(`${file.name}: ${result.error || 'Conversion failed'}`);
      }
    }

    return {
      success: errors.length === 0,
      processedFiles,
      errors,
    };
  }
}
