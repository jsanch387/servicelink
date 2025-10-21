/**
 * Test HEIC Conversion
 *
 * This is a test utility to verify HEIC conversion is working correctly.
 * You can use this to test the conversion process.
 */

import { HeicConverterService } from './heic-converter.service';

export async function testHeicConversion(file: File): Promise<void> {
  console.log('🧪 Testing HEIC conversion for file:', {
    name: file.name,
    type: file.type,
    size: file.size,
  });

  try {
    // Test if file is detected as HEIC
    const isHeic = HeicConverterService.isHeicFile(file);
    console.log('🔍 Is HEIC file?', isHeic);

    if (!isHeic) {
      console.log('ℹ️ File is not HEIC, no conversion needed');
      return;
    }

    // Test conversion
    const result = await HeicConverterService.convertToJpeg(file);

    if (result.success && result.jpegFile) {
      console.log('✅ Conversion successful:', {
        originalName: file.name,
        convertedName: result.jpegFile.name,
        originalType: file.type,
        convertedType: result.jpegFile.type,
        originalSize: file.size,
        convertedSize: result.jpegFile.size,
      });
    } else {
      console.error('❌ Conversion failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testHeicConversion = testHeicConversion;
}
