import heicConvert from 'heic-convert';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    console.log('🔄 HEIC conversion API called');

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error('❌ No file provided');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('📁 File received:', {
      name: file.name,
      size: buffer.length,
      type: file.type,
    });

    const outputBuffer = await heicConvert({
      buffer,
      format: 'JPEG',
      quality: 0.9,
    });

    console.log('✅ HEIC conversion successful:', {
      originalSize: buffer.length,
      convertedSize: outputBuffer.length,
      compression:
        Math.round((1 - outputBuffer.length / buffer.length) * 100) + '%',
    });

    return new NextResponse(new Uint8Array(outputBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': outputBuffer.length.toString(),
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    console.error('❌ HEIC conversion failed:', err);
    return NextResponse.json(
      {
        error: 'HEIC conversion failed',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
