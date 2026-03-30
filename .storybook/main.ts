import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
  stories: ['../projects/ngx/**/*.stories.@(js|jsx|mjs|ts|tsx)', '../projects/ngx/**/*.mdx'],
  addons: ['@storybook/addon-links', '@storybook/addon-docs'],
  framework: {
    name: '@storybook/angular',
    options: {},
  },
  staticDirs: ['../projects/ngx/dashboard/stories'],
  features: {
    angularFilterNonInputControls: true,
  },
};

export default config;
