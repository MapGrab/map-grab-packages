import { expect, MapController } from '@mapgrab/playwright';
import { JSHandle, errors } from '@playwright/test';

import { test } from '../../fixtures/base.fixture';
import { MapRect, MapType } from '@mapgrab/map-interface-types';

async function spyOnMap(controller: MapController, method: keyof MapType): Promise<JSHandle<{ calls: any[] }>> {
  const mapInstance = await controller.getMapInstance();

  return await mapInstance.evaluateHandle(
    (map, { method }) => {
      const originalFunc = map[method];
      const spyObj = { calls: [] };

      map[method] = function (...args) {
        spyObj.calls.push(args);
        originalFunc.apply(map, arguments);

        return map;
      };

      return spyObj;
    },
    { method }
  );
}

test.describe('Map Controller', () => {
  test.describe('waitToMapRepaint()', () => {
    test('should wait map to repaint', async ({ page, mainMapController: controller }) => {
      await page.goto('');

      await controller.waitToMapStable();

      await Promise.all([
        controller.fitMapToBounds([11, 32, 19, 48], { animate: true, duration: 4000 }),
        controller.waitToMapRepaint(),
      ]);

      await expect(await page.screenshot()).toMatchSnapshot('wait-to-repaint.png');
    });

    test('should throw timeout error when map not repaint', async ({ page, mainMapController: controller }) => {
      await page.goto('');

      await controller.waitToMapStable();

      await expect(() => controller.waitToMapRepaint({ timeout: 4000 })).rejects.toThrowError(errors.TimeoutError);
    });
  });

  test.describe('setView()', () => {
    test('should execute jumpTo method on map instance', async ({ page, mainMapController: controller }) => {
      await page.goto('');

      const spyObj = await spyOnMap(controller, 'jumpTo');

      await controller.setView({ center: [11, 12], zoom: 2 });

      await expect(await spyObj.evaluate((s) => s)).toEqual({ calls: [[{ center: [11, 12], zoom: 2 }]] });
    });
  });

  test.describe('setViewAbsolute()', () => {
    test('should execute jumpTo method on map instance with translated center', async ({
      page,
      mainMapController: controller,
    }) => {
      await page.goto('');

      const spyObj = await spyOnMap(controller, 'jumpTo');

      const center = await (
        await controller.getMapInstance()
      ).evaluate(
        (map, center) => {
          return map.unproject(center);
        },
        [11, 12]
      );

      await controller.setViewAbsolute({ center: [11, 12], zoom: 2 });

      await expect(await spyObj.evaluate((s) => s)).toEqual({ calls: [[{ center, zoom: 2 }]] });
    });
  });

  test.describe('fitMapToBounds()', () => {
    test('should execute fitBounds method on map instance', async ({ page, mainMapController: controller }) => {
      await page.goto('');

      const spyObj = await spyOnMap(controller, 'fitBounds');

      await controller.fitMapToBounds([11, 11, 14, 14], { zoom: 11 });

      await expect(await spyObj.evaluate((s) => s)).toEqual({
        calls: [[[11, 11, 14, 14], { animate: false, zoom: 11 }]],
      });
    });
  });

  test.describe('fitMapToBoundingBox()', () => {
    test('should execute fitBounds method on map instance', async ({ page, mainMapController: controller }) => {
      await page.goto('');

      const spyObj = await spyOnMap(controller, 'fitBounds');

      const bbox = new MapRect(11, 11, 200, 200);

      const { sw, ne } = await (
        await controller.getMapInstance()
      ).evaluate((map, bbox) => {
        const { x, y } = map.getCanvasContainer().getBoundingClientRect();

        const sw = map.unproject([bbox.x - x, bbox.bottom - y]);
        const ne = map.unproject([bbox.right - x, bbox.y - y]);

        return { sw, ne };
      }, bbox);

      await controller.fitMapToBoundingBox(bbox, { maxDuration: 11 });

      await expect(await spyObj.evaluate((s) => s)).toEqual({
        calls: [[[sw, ne], { animate: false, maxDuration: 11 }]],
      });
    });
  });

  test.describe('exposeLayers()', () => {
    test('should expose provided layers and hide others', async ({ page, mainMapController: controller }) => {
      await page.goto('');

      const spyObj = await spyOnMap(controller, 'setLayoutProperty');

      const exposeState = await controller.exposeLayers(['countries-label'], ['countries-fill']);

      await expect(await spyObj.evaluate((s) => s)).toEqual({
        calls: [['countries-fill', 'visibility', 'none']],
      });

      expect(exposeState).toEqual({
        'countries-fill': { from: 'visible', to: 'none' },
      });
    });
  });

  test.describe('revertExposeLayers()', () => {
    test('should expose provided layers and hide others', async ({ page, mainMapController: controller }) => {
      await page.goto('');

      const exposeState = await controller.exposeLayers(['countries-label'], ['countries-fill']);

      const spyObj = await spyOnMap(controller, 'setLayoutProperty');
      await controller.revertExposeLayers(exposeState);

      await expect(await spyObj.evaluate((s) => s)).toEqual({
        calls: [['countries-fill', 'visibility', 'visible']],
      });
    });
  });

  test.describe('setBackgroundColor()', () => {
    test('should expose provided layers and hide others', async ({ page, mainMapController: controller }) => {
      await page.goto('');

      await controller.exposeLayers(['countries-fill']);
      await controller.setBackgroundColor('red');

      const locator = page.locator('[data-mapgrab-map-id="mainMap"]');

      await expect(await locator.screenshot()).toMatchSnapshot('setBackground.png');
    });
  });

  test.describe('removeBackground()', () => {
    test('should expose provided layers and hide others', async ({ page, mainMapController: controller }) => {
      await page.goto('');

      await controller.exposeLayers(['countries-fill']);
      await controller.setBackgroundColor('red');
      await controller.removeBackground();

      const locator = page.locator('[data-mapgrab-map-id="mainMap"]');

      await expect(await locator.screenshot()).toMatchSnapshot('removeBackground.png');
    });
  });

  test.describe('projectLngLatToScreenPoint()', () => {
    test('should return correct points', async ({ page, mainMapController: controller }) => {
      await page.goto('');

      expect(await controller.projectLngLatToScreenPoint({ lat: 11, lng: 30 })).toEqual({ x: 725, y: 329 });
    });
  });

  test.describe('unprojectLngLatToScreenPoint()', () => {
    test('should return correct points', async ({ page, mainMapController: controller }) => {
      await page.goto('');

      const { lat, lng } = await controller.unprojectLngLatToScreenPoint({ x: 725, y: 329 });

      expect(lat).toBeGreaterThan(10);
      expect(lat).toBeLessThan(11);

      expect(lng).toBeGreaterThan(29);
      expect(lng).toBeLessThan(30);
    });
  });
});
