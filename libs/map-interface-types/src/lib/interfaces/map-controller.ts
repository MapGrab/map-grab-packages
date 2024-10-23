import type { MapRectInterface } from './map-rect';
import type { LngLatInterface, PointInterface } from './models';

export type RequireAtLeastOne<T> = {
  [K in keyof T]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<keyof T, K>>>;
}[keyof T];

export type PaddingOptions = { top: number; bottom: number; left: number; right: number };

export type SetViewOptions = {
  center?: CenterLike;
  pitch?: number;
  zoom?: number;
  bearing?: number;
  around?: LngLatLike;
  padding?: PaddingOptions;
};
export type CenterLike = [number, number];

export type FitBoundsOptions = SetViewOptions & {
  linear?: boolean;
  offset?: [number, number];
  maxZoom?: number;
  curve?: number;
  minZoom?: number;
  speed?: number;
  screenSpeed?: number;
  maxDuration?: number;
  padding?: number | RequireAtLeastOne<PaddingOptions>;
  duration?: number;
  easing?: (_: number) => number;
  animate?: boolean;
  essential?: boolean;
  freezeElevation?: boolean;
};

export type LngLatLike =
  | {
      lng: number;
      lat: number;
    }
  | {
      lon: number;
      lat: number;
    }
  | [number, number];

export type LngLatBoundsLike = [LngLatLike, LngLatLike] | [number, number, number, number];

export interface MapControllerInterface {
  setView(opts: SetViewOptions): void;
  setViewAbsolute(opts: SetViewOptions): void;
  fitMapToBounds(bounds: LngLatBoundsLike, options?: FitBoundsOptions): void;
  fitMapToBoundingBox(bbox: MapRectInterface, options?: FitBoundsOptions): void;
  exposeLayers(layersToExpose: string[], layersToHide: string[] | 'allOther'): ExposeMutationResult;
  revertExposeLayers(exposeMutationState: ExposeMutationResult): void;
  setBackgroundColor(backgroundColor: string): void;
  removeBackground(): void;
  waitToMapLoaded(): Promise<boolean> | boolean;
  waitToMapStable(): Promise<void> | void;
  projectLngLatToScreenPoint(lngLat: LngLatLike): PointInterface;
  unprojectScreenPointToLngLat(point: PointInterface): LngLatInterface;
}

export type ExposeMutationResult = {
  [key in string]: { from: 'visible' | 'none'; to: 'visible' | 'none' };
};
