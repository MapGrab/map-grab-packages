import { expect } from '@mapgrab/playwright';

import { test } from '../../fixtures/base.fixture';
import { createEventHandler } from '../../utils/map';
import { SymbolSeed } from '../../utils/map-features';

test.describe('Symbol Layer', () => {
  test.describe('Point-Like symbols', () => {
    test('Interface should return correct bounding box and interaction point of text-only label', async ({
      page,
      mapLocator,
    }) => {
      const polandSymbolLocator = mapLocator(
        'map[id=mainMap] layer[id=countries-label] filter["==",["get","NAME"],"Poland"]'
      );

      const polandFillLocator = mapLocator(
        'map[id=mainMap] layer[id=countries-fill] filter["==",["get","NAME"],"Poland"]'
      );

      await page.goto('');

      await polandFillLocator.fitMap();

      await expect(await polandSymbolLocator.screnshoot({ expose: { backgroundColor: 'red' } })).toMatchSnapshot(
        'poland-symbol.png'
      );

      const spy = await createEventHandler(page, 'mainMap', 'click', 'countries-label');

      await polandSymbolLocator.click();
      await expect(await spy.evaluate((d) => d)).toEqual(
        expect.objectContaining({ type: 'click', featureProps: expect.objectContaining({ NAME: 'Poland' }) })
      );
    });

    test('Interface should return correct bounding box and interaction point of icon-only label', async ({
      page,
      mapLocator,
      isMapbox,
    }) => {
      const catSymbolLocator = mapLocator('map[id=mainMap] layer[id=cats]').first();

      await page.goto('');
      const seed = new SymbolSeed(page, 'mainMap', 'cats', isMapbox);
      await seed.setLayerSpec({ paint: { 'icon-translate': [200, 20] } });
      await seed.addSymbol({ text: '', id: -123, 'icon-offset': [20, 20], 'icon-rotate': 90 }, [178, 20]);
      await seed.attach();

      await expect(await catSymbolLocator.screnshoot({ expose: { backgroundColor: 'red' } })).toMatchSnapshot(
        'cat-icon-only-symbol.png'
      );

      if (!isMapbox) {
        const spy = await createEventHandler(page, 'mainMap', 'click', 'cats');

        await catSymbolLocator.click();
        await expect(await spy.evaluate((d) => d)).toEqual(
          expect.objectContaining({ type: 'click', featureProps: expect.objectContaining({ id: -123 }) })
        );
      }
    });

    test('Interface should return correct bounding box of icon-text label', async ({ page, isMapbox, mapLocator }) => {
      const catSymbolLocator = mapLocator('map[id=mainMap] layer[id=cats]').first();

      await page.goto('');
      const seed = new SymbolSeed(page, 'mainMap', 'cats', isMapbox);
      await seed.setLayerSpec({
        paint: { 'text-translate': [0, 20], 'icon-translate': [25, 20] },
        layout: { 'text-offset': [1, 1] },
      });
      await seed.addSymbol({ text: 'My awesome icon' }, [178, 20]);
      await seed.attach();

      await expect(await catSymbolLocator.screnshoot({ expose: { backgroundColor: 'red' } })).toMatchSnapshot(
        'cat-icon-text-symbol.png'
      );
    });

    test('Interface should return correct bounding box of icon-text label 2', async ({
      page,
      isMapbox,
      mapLocator,
      mainMapController: controller,
    }) => {
      const catSymbolLocator = mapLocator('map[id=mainMap] layer[id=cats]').first();

      await page.goto('');
      const seed = new SymbolSeed(page, 'mainMap', 'cats', isMapbox);
      await seed.setLayerSpec({
        paint: { 'text-translate': [10, -2], 'icon-translate': [0, 70] },
        layout: {
          'text-offset': [10, 2],
          'icon-offset': [10, 30],
          'icon-anchor': 'bottom-left',
          'text-field': 'ASdsad',
          'icon-rotation-alignment': 'map',
          'text-rotation-alignment': 'map',
          'text-optional': true,
          'text-padding': 3,
        },
      });
      await seed.addSymbol({ text: 'My awesome icon' }, [2, 20]);
      await seed.attach();

      await controller.waitToMapStable();
      const map = await controller.getMapInstance();
      await map.evaluate((map) => {
        map.setBearing(60);
        // map.setPitch(50);
      });

      await expect(await catSymbolLocator.screnshoot({ expose: { backgroundColor: 'red' } })).toMatchSnapshot(
        'cat-icon-text-symbol-rotated.png'
      );
    });
  });

  test.describe('Line-Like symbols', () => {
    test('Interface should return correct bonding box of text-only label', async ({ page, mapLocator }) => {
      const equatorSymbolLocator = mapLocator(
        'map[id=mainMap] layer[id=geolines-label] filter["==", ["get", "name"], "Equator"]'
      );

      await page.goto('');

      await expect(await equatorSymbolLocator.merge().screnshoot()).toMatchSnapshot('equator-labels.png');
      await expect(await equatorSymbolLocator.nth(1).screnshoot()).toMatchSnapshot('second-equator-label.png');
    });

    test('Interface should return correct bonding box and interaction point of text-only label placement on lines', async ({
      page,
      mapLocator,
      mainMapController: controller,
    }) => {
      const boundaryTextLocator = mapLocator('map[id=mainMap] layer[id=boundary-labels]');

      await page.goto('');

      await controller.fitMapToBounds([
        [13.546358164644829, 48.439268809983616],
        [14.782046299526371, 48.89265765945245],
      ]);
      const map = await controller.getMapInstance();
      await map.evaluate((map) => {
        map.addLayer({
          id: 'boundary-labels',
          source: 'maplibre',
          type: 'symbol',
          'source-layer': 'countries',
          layout: { 'text-field': 'Test text boundary', 'symbol-placement': 'line' },
        });
      });

      await expect(await boundaryTextLocator.merge().screnshoot()).toMatchSnapshot('boundary-labels.png');
      await expect(await boundaryTextLocator.nth(4).screnshoot()).toMatchSnapshot('single-boundary-label.png');

      const spy = await createEventHandler(page, 'mainMap', 'click', 'boundary-labels');

      await boundaryTextLocator.nth(3).click();
      await expect(await spy.evaluate((d) => d)).toEqual(expect.objectContaining({ type: 'click' }));
    });
  });
});
