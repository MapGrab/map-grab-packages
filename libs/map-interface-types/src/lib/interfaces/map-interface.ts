import type { MapControllerInterface } from './map-controller';
import type { MapEngine, MapType } from './models';

export interface MapInterfaceI {
  controller: MapControllerInterface;
  mapEngine: MapEngine;
  map: MapType;
  mapId: string;
}
