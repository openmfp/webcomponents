// @ts-check
import angularConfig from '@openmfp/eslint-config-typescript/angular.js';
import tsEslint from 'typescript-eslint';

export default tsEslint.config(
  {
    ignores: ['dist', 'coverage', '.angular'],
  },
  ...angularConfig,
  {
    // Disable jest rules — this project uses Vitest, not Jest
    files: ['**/*.spec.ts'],
    rules: {
      'jest/no-deprecated-functions': 'off',
      'jest/expect-expect': 'off',
      'jest/valid-title': 'off',
      'jest/no-conditional-expect': 'off',
    },
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Override shared config defaults for this library
      '@angular-eslint/prefer-on-push-component-change-detection': 'off',
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'mfp', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'mfp', style: 'kebab-case' },
      ],
    },
  },
);
