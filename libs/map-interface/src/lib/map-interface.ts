import { MapEngine, type MapType } from '@mapgrab/map-interface-types';
import { MapBoxMapController } from './map-controllers/mapbox.map-controller';
import { MapLibreMapController } from './map-controllers/maplibre.map-controller';

import type { Map as MapBoxMap } from 'mapbox-gl';
import type { MapControllerInterface, MapInterfaceI } from '@mapgrab/map-interface-types';

export class MapInterface implements MapInterfaceI {
  public readonly controller: MapControllerInterface;
  public readonly mapEngine: MapEngine = MapEngine.MapLibre;

  constructor(public readonly mapId: string, public readonly map: MapType) {
    this.mapEngine = map.getContainer().className.includes('mapbox') ? MapEngine.MapBox : MapEngine.MapLibre;

    if (this.mapEngine === MapEngine.MapBox) {
      this.controller = new MapBoxMapController(map as MapBoxMap);
    } else {
      this.controller = new MapLibreMapController(map);
    }
  }
}
