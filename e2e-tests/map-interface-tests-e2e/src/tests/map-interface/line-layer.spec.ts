import { faker } from '@faker-js/faker';
import { expect } from '@mapgrab/playwright';

import { test } from '../../fixtures/base.fixture';
import { createEventHandler } from '../../utils/map';
import { LineSeed } from '../../utils/map-features';

test.describe('Line Layer', () => {
  test('Interface should return correct interaction point', async ({ page, mapLocator }) => {
    await page.goto('');

    const seeder = new LineSeed(page, 'mainMap', 'lines');
    await seeder.generateLines(10);
    await seeder.attach();

    await mapLocator('layer[id=lines]').forEach(async (element) => {
      const spy = await createEventHandler(page, 'mainMap', 'click', 'lines');

      await element.click();
      await expect(await spy.evaluate((d) => d)).toEqual(expect.objectContaining({ type: 'click' }));
    });
  });

  test('Interface should apply offset and translate to line', async ({ page, mapLocator }) => {
    await page.goto('');

    const seeder = new LineSeed(page, 'mainMap', 'lines');
    seeder.setLayerSpec({
      paint: {
        'line-offset': faker.number.int({ min: 5, max: 10 }),
        'line-translate': [faker.number.int({ min: 5, max: 30 }), faker.number.int({ min: 5, max: 30 })],
      },
    });
    await seeder.generateLines(1);
    await seeder.attach();
    await page.waitForTimeout(2000);

    await mapLocator('layer[id=lines]').forEach(async (element) => {
      const spy = await createEventHandler(page, 'mainMap', 'click', 'lines');

      await element.click();
      await expect(await spy.evaluate((d) => d)).toEqual(expect.objectContaining({ type: 'click' }));
    });
  });

  test('Interface should return correct bonding box of line', async ({ page, mapLocator }) => {
    const equatorLineLocator = mapLocator('map[id=mainMap] layer[id=geolines] filter["==",["get","name"],"Equator"]');

    await page.goto('');

    await expect(await equatorLineLocator.screnshoot({ expose: { backgroundColor: 'red' } })).toMatchSnapshot(
      'equator-line-translate.png'
    );
  });

  test('Interface should return only visible lines', async ({ page, mapLocator }) => {
    await page.goto('');

    const seeder = new LineSeed(page, 'mainMap', 'circles');
    await seeder.generateLines(4);
    await seeder.addLine({ opacity: 0 });
    await seeder.attach();

    const lineLocator = mapLocator('layer[id=circles]');

    await expect(lineLocator).toBeVisibleOnMap();
    // 5 visible and 1 with opacity 0
    await expect(lineLocator).toHaveCountOnMap(4);
  });

  test('Interface should return merged cross-boundary lines', async ({ page, mapLocator }) => {
    await page.goto('');

    const seeder = new LineSeed(page, 'mainMap', 'circles');
    await seeder.addCrossTileBoundaryLine({ id: 1, color: 'green' });
    await seeder.attach();

    const lineLocator = mapLocator('layer[id=circles]');
    const crossBoundaryLocator = mapLocator('layer[id=circles] filter["==", ["get", "id"], 1]');

    await expect(lineLocator).toBeVisibleOnMap();
    await expect(lineLocator).toHaveCountOnMap(1);
    await expect(await crossBoundaryLocator.screnshoot({ expose: false, padding: 10 })).toMatchSnapshot(
      'merged-cross-boundary-line.png'
    );
  });
});
