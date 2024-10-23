import { MapController } from '@mapgrab/playwright';
import { Page } from '@playwright/test';
import { MapLayerMouseEvent } from 'mapbox-gl';
import { LayerSpecification, SourceSpecification } from 'maplibre-gl';

export async function addMapReSource(
  page: Page,
  mapId: string,
  resource: {
    layer?: LayerSpecification;
    source?: { id: string; spec: SourceSpecification };
    image?: { id: string; url: string };
  },
  isMapbox = true,
  delay = 2000
) {
  const controller = new MapController(page, mapId);
  await controller.waitToMapLoaded();
  const map = await controller.getMapInstance();

  await map.evaluate(
    async (map, { source, layer, image, isMapbox, delay }) => {
      if (image) {
        if (isMapbox) {
          await new Promise((r) => {
            map.loadImage(image.url, (e, i) => {
              map.addImage(image.id, i);
              r();
            });
          });
        } else {
          const i = await map.loadImage(image.url);
          map.addImage(image.id, i.data);
        }
      }

      setTimeout(() => {
        if (source) {
          map.addSource(source.id, source.spec);
        }

        if (layer) {
          map.addLayer(layer);
        }
      }, delay);
    },
    { source: resource.source, layer: resource.layer, image: resource.image, isMapbox, delay }
  );

  await controller.waitToMapStable();
}

export async function createEventHandler(
  page: Page,
  mapId: string,
  event: string,
  layerId: string,
  iframeLocator?: string
) {
  const controller = new MapController(page, mapId);
  if (iframeLocator) {
    controller.onIframe(iframeLocator);
  }
  const map = await controller.getMapInstance();

  return await map.evaluateHandle(
    (map, { event, layerId }) => {
      const receivedEvent = { type: '' };
      const handler = (e: MapLayerMouseEvent) => {
        map.off(event, layerId, handler);

        receivedEvent.type = e.type;
        receivedEvent.featureProps = e.features ? e.features[0]?.properties || {} : null;
      };

      map.on(event, layerId, handler);

      return receivedEvent;
    },
    { event, layerId }
  );
}
