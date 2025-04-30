//@ts-nocheck
import type { MapGeoJSONFeature } from 'maplibre-gl';

import { MapInterface } from '../map-interface';
import { type DisplayRecordBaseFeature, type MapType, Point } from '@mapgrab/map-interface-types';
import { MapRect } from '@mapgrab/map-interface-types';
import { ResultFeature } from '../models/result-feature';

export function translate(
  queryGeometry: Array<Point>,
  translate: [number, number],
  translateAnchor: 'viewport' | 'map',
  bearing: number,
  pixelsToTileUnits: number
) {
  if (!translate[0] && !translate[1]) {
    return queryGeometry;
  }
  const pt = Point.convert(translate)._mult(pixelsToTileUnits);

  if (translateAnchor === 'viewport') {
    pt._rotate(-bearing);
  }

  const translated = [];
  for (let i = 0; i < queryGeometry.length; i++) {
    const point = queryGeometry[i];
    translated.push(point.add(pt));
  }
  return translated;
}

export function offset(queryGeometry: Array<Point>, offset: number, pixelsToTileUnits: number) {
  if (offset == null || offset === 0) {
    return queryGeometry;
  }
  const pt = Point.convert([Math.abs(offset), Math.abs(offset)])._mult(pixelsToTileUnits);

  const translated = [];
  for (let i = 0; i < queryGeometry.length; i++) {
    const point = queryGeometry[i];
    if (offset < 0) {
      translated.push(point.sub(pt));
    } else {
      translated.push(point.add(pt));
    }
  }

  return translated;
}

export function transformResult(
  baseFeature: MapGeoJSONFeature | mapboxgl.MapboxGeoJSONFeature,
  display: DisplayRecordBaseFeature,
  mapBBox: DOMRect,
  mapId: string
): ResultFeature {
  const rect = display.mapRect;

  const minX = Math.round(Math.max(mapBBox.x, rect.x + mapBBox.x)),
    minY = Math.round(Math.max(mapBBox.y, rect.y + mapBBox.y)),
    maxX = Math.round(Math.min(mapBBox.right, rect.right + mapBBox.x)),
    maxY = Math.round(Math.min(mapBBox.bottom, rect.bottom + mapBBox.y));

  const mapRect = new MapRect(minX, minY, maxX, maxY);

  const interactionPoints = display.interactionPoints.map((p) => {
    // Apply map position on page
    p.x += mapBBox.x;
    p.y += mapBBox.y;

    p.x = Math.round(p.x);
    p.y = Math.round(p.y);

    // Fix in map container positions
    if (p.x < 0) p.x = 0;
    if (p.y < 0) p.y = 0;

    if (p.x >= mapBBox.right) p.x = mapBBox.right - 1;
    if (p.y >= mapBBox.bottom) p.y = mapBBox.bottom - 1;

    return { x: p.x, y: p.y };
  });

  return new ResultFeature(
    baseFeature.id,
    baseFeature.source,
    baseFeature.layer.id,
    baseFeature.properties ?? {},
    mapId,
    display.isVisible,
    interactionPoints,
    mapRect
  );
}

export function getVisibleMapBBox(map: MapType): DOMRect {
  const mapBBox = map.getContainer().getBoundingClientRect();

  return new DOMRectReadOnly(mapBBox.x, mapBBox.y, mapBBox.width, mapBBox.height);
}

export function findInteractionPoint(
  translatedPolygon: Point[],
  feature: MapGeoJSONFeature | mapboxgl.MapboxGeoJSONFeature,
  mapInterface: MapInterface,
  mapBBox: DOMRect
): Point | undefined {
  const checkInteraction = (point: Point): boolean => {
    if (point.x < 0 || point.y < 0) return false;
    if (point.x >= mapBBox.width || point.y >= mapBBox.height) return false;

    return !!mapInterface.map.queryRenderedFeatures([point.x, point.y], { layers: [feature.layer.id] }).find((f) => {
      return f.id === feature.id && shallowEqual(f.properties, feature.properties);
    });
  };

  for (const point of translatedPolygon) {
    point.x = Math.round(point.x);
    point.y = Math.round(point.y);

    if (checkInteraction(point)) {
      return point;
    }

    //-------
    //| \   |
    //|  \  |
    //|   \ |
    //-------
    const square = 5;

    for (let i = 1; i <= square; i++) {
      if (checkInteraction(new Point(point.x - i, point.y - i))) {
        return new Point(point.x - i, point.y - i);
      }
    }

    for (let i = 1; i <= square; i++) {
      if (checkInteraction(new Point(point.x + i, point.y + i))) {
        return new Point(point.x + i, point.y + i);
      }
    }

    for (let i = 1; i <= square; i++) {
      if (checkInteraction(new Point(point.x - i, point.y + i))) {
        return new Point(point.x - i, point.y + i);
      }
    }

    for (let i = 1; i <= square; i++) {
      if (checkInteraction(new Point(point.x + i, point.y - i))) {
        return new Point(point.x + i, point.y - i);
      }
    }

    for (let i = 1; i <= square; i++) {
      if (checkInteraction(new Point(point.x, point.y - i))) {
        return new Point(point.x, point.y - i);
      }
    }

    for (let i = 1; i <= square; i++) {
      if (checkInteraction(new Point(point.x, point.y + i))) {
        return new Point(point.x, point.y + i);
      }
    }

    for (let i = 1; i <= square; i++) {
      if (checkInteraction(new Point(point.x + i, point.y))) {
        return new Point(point.x + i, point.y);
      }
    }

    for (let i = 1; i <= square; i++) {
      if (checkInteraction(new Point(point.x - i, point.y))) {
        return new Point(point.x - i, point.y);
      }
    }
  }

  return;
}

function shallowEqual(object1: Record<any, any>, object2: Record<any, any>) {
  const keys1 = Object.keys(object1);
  const keys2 = Object.keys(object2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (object1[key] !== object2[key]) {
      return false;
    }
  }

  return true;
}
