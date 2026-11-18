import { openEditCardsDialog } from '../utils/edit-cards';
import { enterEditMode, openHarness } from '../utils/harness';
import { type Page, expect, test } from '@playwright/test';

const NON_DEFAULT_HORIZON_THEMES = [
  'sap_horizon_dark',
  'sap_horizon_hcb',
  'sap_horizon_hcw',
] as const;

type OpenUI5ThemingStub = {
  __mfpSwitchTheme: (theme: string) => void;
};

async function stubOpenUI5(page: Page): Promise<void> {
  await page.addInitScript(() => {
    let currentTheme = 'sap_horizon';
    const appliedHandlers: (() => void)[] = [];
    const modules: Record<string, unknown> = {
      'sap/ui/core/Theming': {
        getTheme: () => currentTheme,
        attachApplied: (handler: () => void) => appliedHandlers.push(handler),
      },
      'sap/base/i18n/Localization': {
        getLanguageTag: () => 'en',
        attachChange: () => undefined,
      },
    };
    (window as unknown as { sap: unknown }).sap = {
      ui: {
        require: (deps: string[], callback: (module: unknown) => void) =>
          callback(modules[deps[0]]),
      },
    };
    (window as unknown as OpenUI5ThemingStub).__mfpSwitchTheme = (theme) => {
      currentTheme = theme;
      appliedHandlers.forEach((handler) => handler());
    };
  });
}

function sapBackgroundColor(page: Page): Promise<string> {
  return page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue(
      '--sapBackgroundColor',
    ),
  );
}

test.describe('Themes', () => {
  for (const theme of NON_DEFAULT_HORIZON_THEMES) {
    test(`switching to ${theme} registers the theme for every UI5 package`, async ({
      page,
    }) => {
      const themeErrors: string[] = [];
      page.on('console', (message) => {
        if (
          message.type() === 'error' &&
          message.text().includes('not registered for package')
        ) {
          themeErrors.push(message.text());
        }
      });
      await stubOpenUI5(page);
      await openHarness(page);
      const defaultBackground = await sapBackgroundColor(page);

      await page.evaluate(
        (themeName) =>
          (window as unknown as OpenUI5ThemingStub).__mfpSwitchTheme(themeName),
        theme,
      );
      await expect
        .poll(() => sapBackgroundColor(page))
        .not.toBe(defaultBackground);
      await enterEditMode(page);
      await openEditCardsDialog(page);

      expect(themeErrors).toEqual([]);
    });
  }
});
