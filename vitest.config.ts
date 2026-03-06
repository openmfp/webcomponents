import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./projects/webcomponents/declarative-ui/test-setup.ts'],
    include: ['projects/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['projects/**/*.ts'],
      exclude: ['projects/**/*.spec.ts', 'projects/**/public-api.ts'],
    },
  },
});
