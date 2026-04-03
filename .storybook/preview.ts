import { applicationConfig } from '@storybook/angular';
import type { Preview } from '@storybook/angular';
import '@ui5/webcomponents-icons/dist/AllIcons.js';

// Register mfp-declarative-table and mfp-visited-service-card custom elements
const script = document.createElement('script');
script.type = 'module';
script.src = '/mfp-webcomponents.js';
document.head.appendChild(script);

const preview: Preview = {
  decorators: [
    applicationConfig({ providers: [] }),
    (story) => ({
      template: `<div style="background-color: #f5f5f5; padding: 30px">${story().template ?? '<ng-content />'}</div>`,
      props: story().props,
    }),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
