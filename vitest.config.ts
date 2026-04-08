import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    dedupe: [
      '@angular/animations',
      '@angular/cdk',
      '@angular/common',
      '@angular/core',
      '@angular/elements',
      '@angular/forms',
      '@angular/platform-browser',
      '@angular/router',
      '@fundamental-ngx/cdk',
      '@fundamental-ngx/core',
      '@fundamental-ngx/i18n',
      '@fundamental-ngx/ui5-webcomponents',
      '@fundamental-ngx/ui5-webcomponents-base',
      '@fundamental-ngx/ui5-webcomponents-fiori',
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
