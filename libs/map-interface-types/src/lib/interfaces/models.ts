import type { Map as MapBoxMap, MapboxGeoJSONFeature } from 'mapbox-gl';
import type { MapGeoJSONFeature, Map as MapLibreMap } from 'maplibre-gl';

import Point from '@mapbox/point-geometry';
import type { MapGrabPublicInterfaceI } from './public-interface';
import type { MapRectInterface } from './map-rect';
import type { ResultFeatureInterface } from './result-feature';

export { Point };

declare global {
  interface Window {
    __MAPGRAB__: MapGrabPublicInterfaceI;
  }
}

export type GeoJSONFeature = MapGeoJSONFeature | MapboxGeoJSONFeature;

export interface PointInterface {
  x: number;
  y: number;
}

export interface LngLatInterface {
  lat: number;
  lng: number;
}

export type PointLike = PointInterface | [number, number];

export type MapType = MapLibreMap | MapBoxMap;

export enum MapEngine {
  MapLibre = 'MapLibre',
  MapBox = 'MapBox',
}

export enum MapGrabEvents {
  MAP_GRAB_INTERFACE_INIT = '__MAPGRAB__::INTERFACE_INIT',
  MAP_INTERFACE_INIT = '__MAPGRAB__::MAP_INTERFACE_INIT',
}

export type DisplayRecordBaseFeature = {
  mapRect: MapRectInterface;
  interactionPoints: Array<{ x: number; y: number }>;
  isVisible: boolean;
};

/* eslint-disable  @typescript-eslint/no-explicit-any */
export type MapInternalType = MapType | any;

export type QueryResult = {
  data: ResultFeatureInterface[];
  meta: {
    cacheHit: boolean;
    cacheKey: number | string;
  };
};
