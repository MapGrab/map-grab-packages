import { test as baseTest } from '@playwright/test';
import { MapLocator } from './map-locator';
import { MapController } from './map-controller';

export const test = baseTest.extend<{
  mapLocator: (selector: string) => MapLocator;
  mapController: (selector: string) => MapController;
}>({
  mapLocator: async ({ page }, use) => {
    await use((selector: string) => new MapLocator(page, selector));
  },

  mapController: async ({ page }, use) => {
    await use((selector: string) => new MapController(page, selector));
  },
});
