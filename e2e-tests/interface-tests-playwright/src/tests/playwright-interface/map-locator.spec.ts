import { faker } from '@faker-js/faker';
import { expect } from '@mapgrab/playwright';
import { featureCollection, point } from '@turf/turf';
import { LayerSpecification, SourceSpecification } from 'maplibre-gl';

import { test } from '../../fixtures/base.fixture';
import { addMapReSource, createEventHandler } from '../../utils/map';
import { Page } from '@playwright/test';

const addGoblins = async (page: Page, layerId = 'goblins', delay = 2000) => {
  const source: { id: string; spec: SourceSpecification } = {
    id: layerId,
    spec: {
      type: 'geojson',
      data: featureCollection([
        point([faker.location.longitude({ min: -160, max: 160 }), faker.location.latitude({ max: 60, min: -60 })], {
          goblinName: faker.person.fullName(),
          id: 'goblin-1',
        }),
        point([faker.location.longitude({ min: -160, max: 160 }), faker.location.latitude({ max: 60, min: -60 })], {
          goblinName: faker.person.fullName(),
          id: 'goblin-2',
        }),
      ]),
    },
  };
  const layer: LayerSpecification = {
    id: layerId,
    type: 'circle',
    source: source.id,
    paint: { 'circle-radius': 5 },
  };

  await addMapReSource(page, 'mainMap', { source, layer }, true, delay);
};

test.describe('Map Locator', () => {
  test.describe('click()', () => {
    test('should click element on map', async ({ page, mapLocator }) => {
      await page.goto('');
      const eventState = await createEventHandler(page, 'mainMap', 'click', 'geolines-label');

      await mapLocator('layer[id=geolines-label]').first().click();
      expect(await eventState.evaluate((e) => e)).toEqual(expect.objectContaining({ type: 'click' }));
    });

    test('should click merged elements on map', async ({ page, mapLocator }) => {
      await page.goto('');
      const eventState = await createEventHandler(page, 'mainMap', 'click', 'geolines-label');

      await mapLocator('layer[id=geolines-label]').merge().click();
      await expect(await eventState.evaluate((e) => e)).toEqual(expect.objectContaining({ type: 'click' }));
    });

    test('should be retry ability', async ({ page, mapLocator }) => {
      await page.goto('');

      const eventState = await createEventHandler(page, 'mainMap', 'click', 'goblins');
      await addGoblins(page, 'goblins', 2000);

      await expect(mapLocator('layer[id=goblins]').first()).toBeHiddenOnMap();
      await await mapLocator('layer[id=goblins]').first().click();
      await expect(await eventState.evaluate((e) => e)).toEqual(expect.objectContaining({ type: 'click' }));
    });

    test('right click should trigger contextmenu event', async ({ page, mapLocator }) => {
      await page.goto('');

      const eventState = await createEventHandler(page, 'mainMap', 'contextmenu', 'goblins');
      await addGoblins(page, 'goblins', 0);

      await await mapLocator('layer[id=goblins]').first().click({ button: 'right' });
      await expect(await eventState.evaluate((e) => e)).toEqual(expect.objectContaining({ type: 'contextmenu' }));
    });

    test('should throw error when matched more than once elment', async ({ page, mapLocator }) => {
      await page.goto('');
      const locator = mapLocator('layer[id=goblins]');

      await addGoblins(page, 'goblins', 0);
      await expect(locator.click()).rejects.toThrowError('To many elements');
    });
  });

  test.describe('dblclick()', () => {
    test('should trigger dblclick event', async ({ page, mapLocator }) => {
      await page.goto('');

      const eventState = await createEventHandler(page, 'mainMap', 'dblclick', 'goblins');
      await addGoblins(page, 'goblins', 0);

      await await mapLocator('layer[id=goblins]').first().dblclick();
      await expect(await eventState.evaluate((e) => e)).toEqual(expect.objectContaining({ type: 'dblclick' }));
    });

    test('should throw error when matched more than once elment', async ({ page, mapLocator }) => {
      await page.goto('');
      const locator = mapLocator('layer[id=goblins]');

      await addGoblins(page, 'goblins', 0);
      await expect(locator.dblclick()).rejects.toThrowError('To many elements');
    });
  });

  test.describe('boundingBox()', () => {
    test('should be retry ability and return screen boundingBox of element', async ({ page, mapLocator }) => {
      await page.goto('');
      const locator = mapLocator('layer[id=goblins]').first();

      await addGoblins(page, 'goblins', 500);

      expect(locator).toBeHiddenOnMap();

      const bbox = await locator.boundingBox();

      expect(bbox).toHaveProperty('x');
      expect(bbox).toHaveProperty('y');
      expect(bbox).toHaveProperty('width', 10);
      expect(bbox).toHaveProperty('height', 10);
      expect(bbox).toHaveProperty('right');
      expect(bbox).toHaveProperty('bottom');
    });

    test('should throw error when matched more than once elment', async ({ page, mapLocator }) => {
      await page.goto('');
      const locator = mapLocator('layer[id=goblins]');

      await addGoblins(page, 'goblins', 0);
      await expect(locator.boundingBox()).rejects.toThrowError('To many elements');
    });
  });

  test.describe('count()', () => {
    test('should return count of element on map', async ({ page, mapLocator }) => {
      await page.goto('');
      const locator = mapLocator('layer[id=goblins]');

      expect(await locator.count()).toEqual(0);

      await addGoblins(page, 'goblins', 0);

      expect(await locator.count()).toEqual(2);
    });
  });

  test.describe('first()', () => {
    test('should return first matched element on map', async ({ page, mapLocator }) => {
      await page.goto('');
      const locator = mapLocator('layer[id=goblins]').first();
      await addGoblins(page, 'goblins', 0);

      expect(await locator.getElement()).toBeTruthy();
    });
  });

  test.describe('last()', () => {
    test('should return last matched element on map', async ({ page, mapLocator }) => {
      await page.goto('');
      const locator = mapLocator('layer[id=goblins]').last();
      await addGoblins(page, 'goblins', 0);

      expect(await locator.getElement()).toBeTruthy();
    });
  });

  test.describe('nth(n)', () => {
    test('should return matched element on map from specific index', async ({ page, mapLocator }) => {
      await page.goto('');
      const locator = mapLocator('layer[id=goblins]').nth(-1);
      const locator2 = mapLocator('layer[id=goblins]').last();
      await addGoblins(page, 'goblins', 0);

      await expect(await locator.getElement()).toEqual(await locator2.getElement());
    });
  });

  test.describe('merge(n)', () => {
    test('should merge matched elements from locator', async ({ page, mapLocator }) => {
      await page.goto('');

      const locator = mapLocator(
        'map[id=mainMap] layer[id=geolines-label] filter["==", ["get", "name"], "Equator"]'
      ).merge();

      await expect(await locator.screnshoot({ expose: true })).toMatchSnapshot('merge-equator-geoline-labels.png');
    });
  });

  test.describe('fitMap(n)', () => {
    test('should fit map to selector', async ({ page, mapLocator }) => {
      await page.goto('');

      const locator = mapLocator('layer[id=countries-fill] filter["==", ["get", "NAME"], "Ghana"]');

      await locator.fitMap();

      await expect(await locator.screnshoot()).toMatchSnapshot('fitMap.png');
    });
  });

  test.describe('onIframe()', () => {
    test('should set context on iframe', async ({ page, mapLocator }) => {
      await page.goto('./iframe');

      const eventState = await createEventHandler(page, 'mainMap', 'click', 'geolines-label', 'iframe');

      const locator = (
        await mapLocator('map[id=mainMap] layer[id=geolines-label] filter["==", ["get", "name"], "Equator"]').onIframe(
          'iframe'
        )
      ).merge();

      await locator.click();
      expect(await eventState.evaluate((e) => e)).toEqual(expect.objectContaining({ type: 'click' }));
      expect(await locator.screnshoot({ expose: true })).toMatchSnapshot('iframe.png');

      expect(await locator.boundingBox({ relativeTo: 'rootWindow' })).toEqual(
        expect.objectContaining({ x: 322, y: 378 })
      );
    });
  });

  test.describe('screenshot()', () => {
    test('should take locator screenshot', async ({ page, mapLocator }) => {
      await page.goto('');

      const locator = mapLocator(
        'map[id=mainMap] layer[id=geolines-label] filter["==", ["get", "name"], "Equator"]'
      ).merge();

      expect(await locator.screnshoot({ expose: true })).toMatchSnapshot('screenshot-with-expose.png');
      expect(
        await locator.screnshoot({ expose: { additionalVisibleLayers: ['countries-fill'], backgroundColor: 'yellow' } })
      ).toMatchSnapshot('screenshot-with-expose-and-background-color.png');
      expect(await locator.screnshoot()).toMatchSnapshot('screenshot-without-expose.png');
    });
  });
});
