import { coordAll } from '@turf/meta';
import bboxClip from '@turf/bbox-clip';
import type { LngLatLike } from 'maplibre-gl';

import { MapInterface } from '../map-interface';
import type { DisplayRecordBaseFeature, MapInternalType, Point, GeoJSONFeature } from '@mapgrab/map-interface-types';
import { MapRect } from '@mapgrab/map-interface-types';
import { ResultFeature } from '../models/result-feature';
import { findInteractionPoint, transformResult, translate } from './utils';

export class FillLayerResolver {
  static resolve(
    mapInterface: MapInterface,
    features: GeoJSONFeature[],
    visibleMapBBox: { projected: DOMRect; unprojected: [number, number, number, number] }
  ): ResultFeature[] {
    const mapInstance: MapInternalType = mapInterface.map,
      style = mapInstance.style,
      canvas = mapInstance.getCanvas(),
      featuresMap: Record<string | number, ResultFeature> = {};

    features.forEach((feature): void => {
      const clipped = bboxClip(feature.geometry as any, visibleMapBBox.unprojected);

      const translateAll = (coords: Point[]) => {
        return translate(
          coords,
          paint.get('fill-translate'),
          paint.get('fill-translate-anchor'),
          mapInstance.transform.angle,
          1
        );
      };

      const styleLayer = style._layers[feature.layer!.id]!,
        project = coordAll(clipped).map((cord) => mapInstance.project(cord as LngLatLike)),
        paint = styleLayer.paint as MapInternalType;

      const filteredTranslatedPolygon = translateAll(project);

      let minX = Math.min(...filteredTranslatedPolygon.map((v) => v.x)),
        minY = Math.min(...filteredTranslatedPolygon.map((v) => v.y)),
        maxX = Math.max(...filteredTranslatedPolygon.map((v) => v.x)),
        maxY = Math.max(...filteredTranslatedPolygon.map((v) => v.y));

      if (minX < 0) minX = 0;
      if (minY < 0) minY = 0;
      if (maxX > canvas.width) maxX = canvas.width;
      if (maxY > canvas.height) maxY = canvas.height;

      const mapRect = new MapRect(minX, minY, maxX, maxY);

      const interactionPoint = findInteractionPoint(
        filteredTranslatedPolygon,
        feature,
        mapInterface,
        visibleMapBBox.projected
      );

      const display: DisplayRecordBaseFeature = {
        mapRect,
        interactionPoints: interactionPoint ? [interactionPoint] : [],
        isVisible: styleLayer.paint.get('fill-opacity').evaluate(feature, feature.state) > 0,
      };

      let newFeature = transformResult(feature, display, visibleMapBBox.projected, mapInterface.mapId);

      const featureId = feature.id ?? `${Object.keys(featuresMap).length}-generated`;
      const existingFeature = featuresMap[featureId];

      if (existingFeature) {
        newFeature = mergeFeature(existingFeature, newFeature);
      }

      featuresMap[featureId] = newFeature;
    });

    return Object.values(featuresMap);
  }
}

export function mergeFeature(featureA: ResultFeature, featureB: ResultFeature): ResultFeature {
  if (featureA === featureB) return featureA;

  const mapRect = featureA.rect.merge(featureB.rect);

  return new ResultFeature(
    featureB.featureId,
    featureB.sourceId,
    featureB.layerId,
    {
      ...featureA.properties,
      ...featureB.properties,
    },
    featureB.mapId,
    featureB.isVisible,
    [...featureA.interactionPoints, ...featureB.interactionPoints],
    mapRect
  );
}
