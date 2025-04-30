import { MapGrabLocator } from '@mapgrab/map-locator';

import { MapInterface } from './map-interface';
import { LocatorQueryResolver } from './locator-query-resolver';
import { MapQuery } from './map-query';
import type { PointLike } from 'mapbox-gl';
import {
  MapGrabEvents,
  type ResultFeatureInterface,
  type MapGrabPublicInterfaceI,
  type MapType,
  UtilsI,
} from '@mapgrab/map-interface-types';
import { UtilsInterface } from './utils-interface';
import { Inspector } from './inspector/inspector';

export function installMapGrab(map: MapType, mapId: string): void {
  if (!window['__MAPGRAB__']) {
    window['__MAPGRAB__'] = new MapGrabPublicInterface();

    const event = new CustomEvent(MapGrabEvents.MAP_GRAB_INTERFACE_INIT);
    window.dispatchEvent(event);
  }

  window['__MAPGRAB__'].registerMapInterface(mapId, new MapInterface(mapId, map));

  const event = new CustomEvent(MapGrabEvents.MAP_INTERFACE_INIT, {
    detail: {
      mapId: mapId,
    },
  });

  window.dispatchEvent(event);
}

export class MapGrabPublicInterface implements MapGrabPublicInterfaceI {
  private readonly mapInterfaces: Map<string, MapInterface> = new Map();
  private inspector?: Inspector | undefined;
  public readonly utils: UtilsI;

  constructor() {
    this.utils = new UtilsInterface();
  }

  public getMapInterface(mapId: string): MapInterface | undefined {
    return this.mapInterfaces.get(mapId);
  }

  public getMapInterfaceIds(): string[] {
    return Array.from(this.mapInterfaces.keys());
  }

  public registerMapInterface(mapId: string, mapInterface: MapInterface): void {
    mapInterface.map.getContainer().setAttribute('data-mapgrab-map-id', mapId);

    this.mapInterfaces.set(mapId, mapInterface);
  }

  public createLocator(locator: string): MapGrabLocator {
    return new MapGrabLocator(locator);
  }

  public async waitMapStableForLocator(selector: string): Promise<void> {
    const locator = new MapGrabLocator(selector);

    if (locator.map) {
      await Promise.all(
        (locator.map?.['id']?.value || []).map((mapId) => this.getMapInterface(mapId)?.controller.waitToMapStable())
      );
    } else {
      await Promise.all(Array.from(this.mapInterfaces.entries()).map(([, i]) => i.controller.waitToMapStable()));
    }
  }

  public query(locatorString: string): ResultFeatureInterface[] {
    const locator: MapGrabLocator = new MapGrabLocator(locatorString),
      queryResolver: LocatorQueryResolver = new LocatorQueryResolver(locator, this.mapInterfaces);

    return queryResolver.resolve();
  }

  public inspectAtPoint(mapId: string, point: PointLike): ResultFeatureInterface[] {
    const mapInterface = this.getMapInterface(mapId);

    if (mapInterface) {
      const datas = MapQuery.queryMap(mapInterface, { queryGeometry: point });

      return datas.reduce<ResultFeatureInterface[]>((acc, ds): ResultFeatureInterface[] => {
        const x =
          ds.featureId != null
            ? MapQuery.queryMap(mapInterface, {
                filter: ['==', ['id'], ds.featureId!],
                layerIds: [ds.layerId],
              })
            : [ds];

        return [...acc, ...x];
      }, []);
    }

    return [];
  }

  public enableInspector(): void {
    if (this.inspector) return;

    this.inspector = new Inspector();
    this.inspector.init();
  }

  public disableInspector(): void {
    this.inspector?.destroy();
    this.inspector = undefined;
  }
}
