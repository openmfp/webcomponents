import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    onUnhandledError(error) {
      // Suppress circular JSON serialization errors from ui5-select's
      // requestAnimationFrame callback in jsdom — a known fundamental-ngx
      // issue that does not affect test results.
      if (error instanceof TypeError && error.message.includes('circular structure')) return;
      throw error;
    },
  },
});
