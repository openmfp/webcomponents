import path from 'path';
import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
  stories: [
    '../projects/ngx/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../projects/ngx/**/*.mdx',
  ],
  addons: ['@storybook/addon-links', '@storybook/addon-docs'],
  framework: {
    name: '@storybook/angular',
    options: {},
  },
  staticDirs: ['../projects/ngx/dashboard/stories'],
  features: {
    angularFilterNonInputControls: true,
  },
  webpackFinal: async (config) => {
    config.resolve = config.resolve ?? {};
    // Force root node_modules to be resolved first, preventing duplicate
    // Angular instances from projects/ngx/declarative-ui/node_modules/@angular.
    // Two @angular/core instances cause NG0203 because each has its own
    // _currentInjector variable, so injection context set in one is invisible to the other.
    config.resolve.modules = [
      path.resolve('./node_modules'),
      ...(Array.isArray(config.resolve.modules) ? config.resolve.modules : ['node_modules']),
    ];
    return config;
  },
};

export default config;
