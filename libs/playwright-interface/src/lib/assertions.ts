import { expect as expectBase } from '@playwright/test';

import { MapLocator } from './map-locator';

const POLL_INTERVAL = [300];

export const expect = expectBase.extend({
  async toBeVisibleOnMap(locator: MapLocator, options?: { timeout?: number }) {
    const assertionName = 'toBeVisibleOnMap';
    let pass: boolean;

    if (this.isNot) {
      throw new Error('use .toBeHiddenOnMap() instead of .not.toBeVisibleOnMap()');
    }

    try {
      await expect
        .poll(
          async () => {
            return await locator.count();
          },
          { intervals: POLL_INTERVAL, message: 'Wait to elements on map', ...options }
        )
        .toBeGreaterThan(0);

      pass = true;
    } catch (e) {
      pass = false;
    }

    const message = () =>
      this.utils.matcherHint(assertionName, undefined, undefined, {
        isNot: this.isNot,
      }) +
      '\n\n' +
      `Locator: ${locator.selector}\n` +
      `Expected: visible\n` +
      `Received: hidden`;

    return { pass, message, expected: 'visible', name: assertionName };
  },

  async toBeHiddenOnMap(locator: MapLocator, options?: { timeout?: number }) {
    const assertionName = 'toBeHiddenOnMap';
    let pass: boolean;

    if (this.isNot) {
      throw new Error('.not.toBeHiddenOnMap() is no supported, use .toBeVisibleOnMap()');
    }

    try {
      await expect
        .poll(
          async () => {
            return await locator.count();
          },
          { intervals: POLL_INTERVAL, message: 'Wait to elements on map', ...options }
        )
        .toBe(0);

      pass = true;
    } catch (e) {
      pass = false;
    }

    const message = () =>
      this.utils.matcherHint(assertionName, undefined, undefined, {
        isNot: this.isNot,
      }) +
      '\n\n' +
      `Locator: ${locator.selector}\n` +
      `Expected: hidden\n` +
      `Received: visible`;

    return { pass, message, expected: 'hidden', name: assertionName };
  },

  async toHaveCountOnMap(locator: MapLocator, expectedCount: number, options?: { timeout?: number }) {
    const assertionName = 'toHaveCountOnMap';
    let pass: boolean;
    let count: number;

    try {
      await expect
        .poll(
          async () => {
            count = await locator.count();

            return this.isNot ? count !== expectedCount : count === expectedCount;
          },
          { message: 'Wait to elements on map', intervals: POLL_INTERVAL, ...options }
        )
        .toBeTruthy();

      pass = true;
    } catch (e) {
      pass = false;
    }

    const message = () =>
      this.utils.matcherHint(assertionName, undefined, undefined, {
        isNot: this.isNot,
      }) +
      '\n\n' +
      `Locator: ${locator.selector}\n` +
      `Expected: ${this.isNot ? 'not ' : ''}${this.utils.printExpected(expectedCount)}\n` +
      `Received: ${this.utils.printReceived(count)}`;

    return { pass: this.isNot ? !pass : pass, message, expected: expectedCount, name: assertionName };
  },
});
