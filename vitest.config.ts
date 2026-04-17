import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    /** jsdom supports RTL tests; pure logic tests run fine here too. */
    environment: 'jsdom',
    include: [
      'src/features/**/testing/**/*.test.ts',
      'src/features/**/testing/**/*.test.tsx',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
