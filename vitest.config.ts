import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  /** Match Next / `react-jsx`: tests must not require `import React` in every `.tsx` file. */
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    /** jsdom supports RTL tests; pure logic tests run fine here too. */
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: [
      'src/features/**/testing/**/*.test.ts',
      'src/features/**/testing/**/*.test.tsx',
      'src/server/**/testing/**/*.test.ts',
    ],
    /** Next requires string PostCSS plugins; Vitest doesn't need real CSS transforms. */
    css: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
