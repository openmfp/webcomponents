import { applicationConfig } from '@storybook/angular';
import type { Preview } from '@storybook/angular';
import '@ui5/webcomponents-icons/dist/AllIcons.js';

let webcomponentsBundle: Promise<void> | undefined;

function loadWebcomponentsBundle(): Promise<void> {
  webcomponentsBundle ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = '/mfp-webcomponents.js';
    script.onload = () => {
      resolve();
    };
    script.onerror = () => {
      reject(new Error('Failed to load /mfp-webcomponents.js'));
    };
    document.head.appendChild(script);
  });
  return webcomponentsBundle;
}

const preview: Preview = {
  decorators: [
    applicationConfig({ providers: [] }),
    (story) => {
      const result = story();
      return {
        ...result,
        template: `<div style="background-color: #f5f5f5; padding: 30px">${result.template ?? '<ng-content />'}</div>`,
      };
    },
  ],
  loaders: [
    async ({ parameters }) => {
      if (parameters['webcomponentsBundle']) {
        await loadWebcomponentsBundle();
      }
      return {};
    },
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
