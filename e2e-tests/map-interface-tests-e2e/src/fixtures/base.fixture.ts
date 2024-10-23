import { MapController, test as mapGrabTest } from '@mapgrab/playwright';
import { ConsoleMessage, expect, LaunchOptions } from '@playwright/test';

import { TestOptions } from '../../playwright.config';

export const test = mapGrabTest.extend<
  LaunchOptions & {
    mainMapController: MapController;
    consoleErrors: ConsoleMessage[];
  } & TestOptions
>({
  page: async ({ page, consoleErrors }, use) => {
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m);
    });
    await use(page);
  },

  mainMapController: async ({ mapController }, use) => {
    await use(mapController('mainMap'));
  },

  isMapbox: [false, { option: true }],
  isMapLibre: [false, { option: true }],
  consoleErrors: [],
});

test.afterEach(async ({ consoleErrors }) => {
  test.setTimeout(1000);
  await expect(consoleErrors, 'should no throw console errors').toEqual([]);
});
