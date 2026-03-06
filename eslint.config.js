// @ts-check
import angularConfig from '@openmfp/eslint-config-typescript/angular.js';
import tsEslint from 'typescript-eslint';

export default tsEslint.config(
  {
    ignores: ['dist', 'coverage', '.angular'],
  },
  ...angularConfig,
  {
    files: ['**/*.ts'],
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
