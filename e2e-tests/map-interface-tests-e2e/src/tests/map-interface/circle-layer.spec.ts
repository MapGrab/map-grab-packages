import { expect as mapExpect } from '@mapgrab/playwright';
import { expect } from '@playwright/test';

import { test } from '../../fixtures/base.fixture';
import { createEventHandler } from '../../utils/map';
import { CircleSeed } from '../../utils/map-features';

test.describe('Circle Layer', () => {
  test('Interface should return correct interaction point', async ({ page, mapLocator }) => {
    await page.goto('');

    const seeder = new CircleSeed(page, 'mainMap', 'circles');
    await seeder.generateCircles(4);
    await seeder.attach();

    await mapLocator('layer[id=circles]').forEach(async (element) => {
      const spy = await createEventHandler(page, 'mainMap', 'click', 'circles');
      await element.click();
      await mapExpect(await spy.evaluate((d) => d)).toEqual(expect.objectContaining({ type: 'click' }));
    });
  });

  test('Interface should return correct interaction point on end of canvas', async ({ page, mapLocator }) => {
    await page.goto('');

    const seeder = new CircleSeed(page, 'mainMap', 'circles');
    await seeder.addCircle({ color: 'red' }, [138, 76.9]);
    await seeder.attach();

    const locator = mapLocator('layer[id=circles]');
    const spy = await createEventHandler(page, 'mainMap', 'click', 'circles');
    await locator.click();
    await mapExpect(await spy.evaluate((d) => d)).toEqual(expect.objectContaining({ type: 'click' }));
  });

  test('Interface should return correct bonding box of circle', async ({ page, mapLocator }) => {
    await page.goto('');

    const seeder = new CircleSeed(page, 'mainMap', 'circles');
    await seeder.generateCircles(4);
    await seeder.addCircle({ id: 1, color: 'green' }, [11, 12]);
    await seeder.addCircle({ opacity: 0 });
    await seeder.attach();

    const greenCircleLocator = mapLocator('layer[id=circles] filter["==", ["get", "id"], 1]');

    await mapExpect(await greenCircleLocator.screnshoot({ expose: true })).toMatchSnapshot('green-circle.png');
  });

  test('Interface should return only visible circles', async ({ page, mapLocator }) => {
    await page.goto('');

    const seeder = new CircleSeed(page, 'mainMap', 'circles');
    await seeder.generateCircles(4);
    await seeder.addCircle({ opacity: 0 });
    await seeder.attach();

    const circlesLocator = mapLocator('layer[id=circles]');

    await mapExpect(circlesLocator).toBeVisibleOnMap();
    // 5 visible and 1 with opacity 0
    await mapExpect(circlesLocator).toHaveCountOnMap(4);
  });
});
