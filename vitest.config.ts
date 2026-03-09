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
    setupFiles: ['./projects/ngx/declarative-ui/test-setup.ts'],
    include: ['projects/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['projects/**/*.ts'],
      exclude: ['projects/**/*.spec.ts', 'projects/**/public-api.ts'],
    },
  },
});
