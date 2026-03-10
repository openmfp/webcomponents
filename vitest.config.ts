import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    angular({
      tsconfig: resolve(
        import.meta.dirname,
        'projects/ngx/declarative-ui/tsconfig.spec.json',
      ),
    }),
  ],
  resolve: {
    alias: {
      jsonpath: resolve(import.meta.dirname, 'projects/ngx/declarative-ui/test-utils/jsonpath-mock.js'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['projects/**/*.spec.ts'],
    onUnhandledError(error) {
      // Suppress circular JSON serialization errors from ui5-select's
      // requestAnimationFrame callback in jsdom — a known fundamental-ngx
      // issue that does not affect test results.
      if (error instanceof TypeError && error.message.includes('circular structure')) return;
      throw error;
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['projects/**/*.ts'],
      exclude: ['projects/**/*.spec.ts', 'projects/**/public-api.ts'],
    },
  },
});
