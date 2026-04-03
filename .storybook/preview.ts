import { applicationConfig } from '@storybook/angular';
import type { Preview } from '@storybook/angular';

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
