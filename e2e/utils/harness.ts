import { type Page, expect } from '@playwright/test';

/**
 * Navigate to the harness page and wait until the custom element has upgraded
 * and rendered. The fixture sets `window.__mfpReady = true` once
 * customElements.whenDefined('mfp-wc-dashboard') resolves.
 */
export async function openHarness(page: Page, path = '/'): Promise<void> {
  await page.goto(path);

  // Wait for the element definition + readiness flag set by the fixture.
  await page.waitForFunction(
    () => (window as unknown as { __mfpReady?: boolean }).__mfpReady === true,
  );

  // The dashboard host renders its root container with data-testid=dashboard.
  await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
}

/**
 * Enter edit mode from the rendered (non-edit) dashboard. The edit-view button
 * is present because the harness config has `editable: true`. Once in edit
 * mode the root container gains the `.edit` class and the grid becomes
 * interactive (keyboard nav + drag/resize).
 */
export async function enterEditMode(page: Page): Promise<void> {
  // Already in edit mode? Nothing to do.
  if (await page.locator('.mfp-dashboard.edit').count()) return;

  await page.locator('[data-testid="dashboard-edit-view-btn"]').first().click();

  // Edit mode is active once the root container has the edit class and the
  // save button is visible.
  await expect(page.locator('.mfp-dashboard.edit')).toBeVisible();
  await expect(
    page.locator('[data-testid="dashboard-save-btn"]'),
  ).toBeVisible();
}
