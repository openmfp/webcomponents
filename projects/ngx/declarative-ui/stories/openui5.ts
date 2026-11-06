const OPENUI5_BOOTSTRAP_URL =
  'https://sdk.openui5.org/1.142.0/resources/sap-ui-core.js';

interface OpenUi5Core {
  ready(): Promise<void>;
}

interface SapGlobal {
  sap?: {
    ui?: {
      require?: (
        dependencies: string[],
        callback: (core: OpenUi5Core) => void,
        errback?: (error: Error) => void,
      ) => void;
    };
  };
}

let openUi5Ready: Promise<void> | undefined;

export function loadOpenUi5(): Promise<void> {
  openUi5Ready ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.id = 'sap-ui-bootstrap';
    script.src = OPENUI5_BOOTSTRAP_URL;
    script.dataset['sapUiResourceRoots'] = JSON.stringify({
      'mfp.story.cards': './ui5-cards',
    });
    script.dataset['sapUiTheme'] = 'sap_horizon';
    script.dataset['sapUiLibs'] = 'sap.m';
    script.dataset['sapUiCompatVersion'] = 'edge';
    script.dataset['sapUiAsync'] = 'true';
    script.dataset['sapUiXxCssVariables'] = 'true';
    script.onload = () => {
      resolve();
    };
    script.onerror = () => {
      reject(new Error(`Failed to load ${OPENUI5_BOOTSTRAP_URL}`));
    };
    document.head.appendChild(script);
  }).then(
    () =>
      new Promise<void>((resolve, reject) => {
        const sapRequire = (globalThis as SapGlobal).sap?.ui?.require;
        if (!sapRequire) {
          reject(new Error('OpenUI5 is not loaded'));
          return;
        }
        sapRequire(
          ['sap/ui/core/Core'],
          (core) => {
            void core.ready().then(resolve);
          },
          reject,
        );
      }),
  );
  return openUi5Ready;
}
