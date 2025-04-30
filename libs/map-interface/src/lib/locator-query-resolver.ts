import type { MapGrabLocator } from '@mapgrab/map-locator';

import type { MapInterface } from './map-interface';
import { MapQuery } from './map-query';
import type { ResultFeatureInterface } from '@mapgrab/map-interface-types';

export class LocatorQueryResolver {
  constructor(private locator: MapGrabLocator, private mapInterfaces: Map<string, MapInterface>) {}

  public resolve(): ResultFeatureInterface[] {
    const maps: MapInterface[] = this.resolveMaps();

    return maps.reduce<ResultFeatureInterface[]>((acc, mapInterface) => {
      try {
        const result = this.queryMap(mapInterface);

        return [...acc, ...result];
      } catch (e) {
        // console.error(e);
        return acc;
      }
    }, []);
  }

  private resolveMaps(): MapInterface[] {
    const locatorMapIds: string[] = this.locator.map?.['id']?.value || [];

    if (locatorMapIds.length === 0) {
      // Query all registered maps when map id not provided
      return Array.from(this.mapInterfaces.keys()).map((mapId) => this.mapInterfaces.get(mapId)!);
    }

    const registeredMapIds: string[] = Array.from(this.mapInterfaces.keys());

    return locatorMapIds.reduce((acc, toMatchMapId) => {
      const mapIds: string[] = registeredMapIds.filter((mapId) =>
        // Resolve map[id=] or map[id*=]
        this.locator.map?.['id']?.comparator === '=' ? toMatchMapId === mapId : mapId.includes(toMatchMapId)
      );

      mapIds.forEach((mapId) => {
        const mapInterface: MapInterface = this.mapInterfaces.get(mapId)!;

        if (mapInterface && !acc.includes(mapInterface)) {
          acc.push(mapInterface);
        }
      });
      return acc;
    }, [] as MapInterface[]);
  }

  private resolveLayers(mapInterface: MapInterface): string[] | undefined {
    const locatorLayerIds: string[] = this.locator.layer?.['id']?.value || [];
    const locatorLayerTypes: string[] = this.locator.layer?.['type']?.value || [];

    if (locatorLayerIds.length === 0 && locatorLayerTypes.length === 0) {
      return;
    }

    const registeredLayers = mapInterface.map.getStyle()?.layers ?? [];

    if (registeredLayers.length === 0) {
      return locatorLayerIds;
    }

    const matchedLayersIds: string[] = registeredLayers
      .filter((layer) => {
        return Object.keys(this.locator.layer || {}).every((prop) => {
          if (prop === 'id') {
            return locatorLayerIds.some((toMatchLayerId) => {
              return this.locator.layer?.['id']?.comparator === '='
                ? toMatchLayerId === layer.id
                : layer.id.includes(toMatchLayerId);
            });
          }

          if (prop === 'type') {
            return locatorLayerTypes.some((toMatchLayerType) => {
              return this.locator.layer?.['type']?.comparator === '='
                ? toMatchLayerType === layer.type
                : layer.type.includes(toMatchLayerType);
            });
          }

          return false;
        });
      })
      .map(({ id }) => id);

    if (matchedLayersIds.length === 0) {
      throw new Error('Layer not exists');
    }

    return matchedLayersIds;
  }

  private queryMap(mapInterface: MapInterface): ResultFeatureInterface[] {
    const layerIds: string[] | undefined = this.resolveLayers(mapInterface);

    return MapQuery.queryMap(mapInterface, { layerIds, filter: this.locator.filter });
  }
}
