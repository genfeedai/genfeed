import { createRequire } from 'node:module';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Force single React instance in monorepo (prevents dual-instance hook errors on CI)
const require = createRequire(import.meta.url);
const reactPath = path.dirname(require.resolve('react/package.json'));
const reactDomPath = path.dirname(require.resolve('react-dom/package.json'));

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    server: {
      deps: {
        inline: [/react/, /react-dom/],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html'],
      include: [
        'src/lib/**/*.ts',
        'src/store/**/*.ts',
        'src/hooks/**/*.ts',
        'src/components/**/*.tsx',
      ],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/types/**', 'src/test/**', 'src/**/index.ts'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      react: reactPath,
      'react-dom': reactDomPath,
    },
    dedupe: ['react', 'react-dom'],
  },
});
