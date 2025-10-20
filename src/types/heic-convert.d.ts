declare module 'heic-convert' {
  interface ConvertOptions {
    buffer: Buffer;
    format: 'JPEG' | 'PNG';
    quality: number;
  }

  function convert(_options: ConvertOptions): Promise<Buffer>;
  export = convert;
}
