import type { MapRectInterface } from './map-rect';

export interface ResultFeatureInterface {
  featureId: number | string | undefined;
  sourceId: string;
  layerId: string;
  properties: Record<string, any>;
  mapId: string;
  isVisible: boolean;
  interactionPoints: { x: number; y: number }[];
  rect: MapRectInterface;
}
