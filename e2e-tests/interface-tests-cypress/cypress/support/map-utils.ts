import { MapController } from '@mapgrab/cypress';
import { LayerSpecification, SourceSpecification } from 'maplibre-gl';

export function addMapReSource(
  cy: Cypress.cy,
  mapId: string,
  resource: {
    layer?: LayerSpecification;
    source?: { id: string; spec: SourceSpecification };
    image?: { id: string; url: string };
  },
  isMapbox = true,
  delay = 0
) {
  const controller = new MapController(cy, cy.state('window'), mapId);

  return controller.waitToMapLoaded().then(() => {
    return controller.getMapInstance().then((map) => {
      const { image, source, layer } = resource;

      if (image) {
        if (isMapbox) {
          map.loadImage(image.url, (e, i) => {
            map.addImage(image.id, i);
          });
        } else {
          map.loadImage(image.url).then(() => {
            map.addImage(image.id, i.data);
          });
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
    });
  });
}

export function createEventHandler(cy: Cypress.Chainable, mapId: string, event: string, layerId: string) {
  return cy
    .mapController(mapId)
    .then((c) => c.getMapInstance())
    .then((map) => {
      const receivedEvent = { type: '' };
      const handler = (e) => {
        map.off(event, layerId, handler);

        receivedEvent.type = e.type;
      };

      map.on(event, layerId, handler);

      return receivedEvent;
    });
}
