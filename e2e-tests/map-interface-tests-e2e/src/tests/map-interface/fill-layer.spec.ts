import { expect, MapController } from '@mapgrab/playwright';

import { test } from '../../fixtures/base.fixture';
import { createEventHandler } from '../../utils/map';
import { FillSeed } from '../../utils/map-features';

test.describe('Fill Layer', () => {
  test('Interface should return correct interaction point', async ({ page, mapLocator }) => {
    test.slow();
    test.setTimeout(200000);

    await page.goto('');

    await expect(mapLocator('layer[id=countries-fill] filter["==", ["get", "CONTINENT"], "Africa"]')).toHaveCountOnMap(
      54
    );

    let clicked = 0;

    await mapLocator('layer[id=countries-fill] filter["==", ["get", "CONTINENT"], "Africa"]').forEach(
      async (element) => {
        const spy = await createEventHandler(page, 'mainMap', 'click', 'countries-fill');
        try {
          await element.click();
          await expect(await spy.evaluate((d) => d)).toEqual(expect.objectContaining({ type: 'click' }));
          clicked++;
        } catch (e) {
          console.log('no click');
        }
      }
    );

    expect(clicked).toBeGreaterThan(50);
  });

  test('Interface should return correct bonding box of fill', async ({ page, mapLocator }) => {
    const polandFillLocator = mapLocator(
      'map[id=mainMap] layer[id=countries-fill] filter["==", ["get", "NAME"], "Poland"]'
    ).first();

    await page.goto('');

    const mapController = new MapController(page, 'mainMap');
    await mapController.setView({ center: [25, 52], zoom: 3 });

    await expect(await polandFillLocator.screnshoot({ expose: true })).toMatchSnapshot('poland-fill-translate.png');
  });

  test('Interface should return only visible fills', async ({ page, mapLocator }) => {
    await page.goto('');

    const seeder = new FillSeed(page, 'mainMap', 'circles');
    await seeder.generateFills(4);
    await seeder.addFill({ opacity: 0 });
    await seeder.attach();

    const fillLocator = mapLocator('layer[id=circles]');

    await expect(fillLocator).toBeVisibleOnMap();
    // 5 visible and 1 with opacity 0
    await expect(fillLocator).toHaveCountOnMap(4);
  });

  test('Interface should return merged cross-boundary fills', async ({ page, mapLocator }) => {
    await page.goto('');

    const seeder = new FillSeed(page, 'mainMap', 'circles');
    await seeder.addCrossTileBoundaryFill({ id: 1, color: 'green' });
    await seeder.attach();

    const fillLocator = mapLocator('layer[id=circles]');
    const crossBoundaryLocator = mapLocator('layer[id=circles] filter["==", ["get", "id"], 1]');

    await expect(fillLocator).toBeVisibleOnMap();
    await expect(fillLocator).toHaveCountOnMap(1);
    await expect(await crossBoundaryLocator.screnshoot({ expose: false, padding: 10 })).toMatchSnapshot(
      'merged-cross-boundary-fill.png'
    );
  });
});
