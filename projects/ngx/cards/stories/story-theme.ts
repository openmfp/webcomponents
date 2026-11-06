import { setTheme } from '@ui5/webcomponents-base/dist/config/Theme.js';
import '@ui5/webcomponents-theming/dist/Assets.js';

export const STORY_THEMES = [
  'sap_horizon',
  'sap_horizon_dark',
  'sap_horizon_hcw',
  'sap_horizon_hcb',
] as const;

export type StoryTheme = (typeof STORY_THEMES)[number];

interface OpenUi5Theming {
  setTheme(theme: string): void;
}

interface SapGlobal {
  sap?: {
    ui?: {
      require?: (
        dependencies: string[],
        callback: (theming: OpenUi5Theming) => void,
      ) => void;
    };
  };
}

export function applyStoryTheme(theme: StoryTheme): void {
  void setTheme(theme);
  (globalThis as SapGlobal).sap?.ui?.require?.(
    ['sap/ui/core/Theming'],
    (theming) => {
      theming.setTheme(theme);
    },
  );
}
