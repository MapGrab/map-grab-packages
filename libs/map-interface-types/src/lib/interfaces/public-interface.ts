import type { MapGrabLocator } from '@mapgrab/map-locator';
import type { PointLike } from './models';
import type { ResultFeatureInterface } from './result-feature';
import { MapInterfaceI } from './map-interface';
import { UtilsI } from './utils-interface';

export interface MapGrabPublicInterfaceI {
  getMapInterface(mapId: string): MapInterfaceI | undefined;
  getMapInterfaceIds(): string[];
  registerMapInterface(mapId: string, mapInterface: MapInterfaceI): void;
  createLocator(locator: string): MapGrabLocator;
  waitMapStableForLocator(selector: string): Promise<void>;
  query(locatorString: string): ResultFeatureInterface[];
  inspectAtPoint(mapId: string, point: PointLike): ResultFeatureInterface[];
  enableInspector(): void;
  disableInspector(): void;
  utils: UtilsI;
}
