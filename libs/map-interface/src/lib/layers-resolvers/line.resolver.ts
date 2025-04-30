import bboxClip from '@turf/bbox-clip';
import { coordAll } from '@turf/meta';
import type { LngLatLike } from 'maplibre-gl';

import { MapInterface } from '../map-interface';
import { DisplayRecordBaseFeature, GeoJSONFeature, MapInternalType } from '@mapgrab/map-interface-types';
import { MapRect } from '@mapgrab/map-interface-types';
import { ResultFeature } from '../models/result-feature';
import { mergeFeature } from './fill.resolver';
import { findInteractionPoint, offset, transformResult, translate } from './utils';

export class LineLayerResolver {
  static resolve(
    mapInterface: MapInterface,
    features: GeoJSONFeature[],
    visibleMapBBox: { projected: DOMRect; unprojected: [number, number, number, number] }
  ): ResultFeature[] {
    const mapInstance: MapInternalType = mapInterface.map,
      style = mapInstance.style,
      featuresMap: Record<string | number, ResultFeature> = {};

    features.forEach((feature) => {
      const styleLayer = style._layers[feature.layer!.id]!,
        clip = bboxClip(feature.geometry as any, visibleMapBBox.unprojected),
        project = coordAll(clip).map((cord) => mapInstance.project(cord as LngLatLike)),
        paint = styleLayer.paint as MapInternalType;

      let translatedPolygon = translate(
        project,
        paint.get('line-translate'),
        paint.get('line-translate-anchor'),
        mapInstance.transform.angle,
        1
      );

      translatedPolygon = offset(translatedPolygon, paint.get('line-offset').evaluate(feature, feature.state), 1);

      const lineBlur = paint.get('line-blur').evaluate(feature, feature.state) || 0,
        styleLineWidth = getLineWidth(
          paint.get('line-width').evaluate(feature, feature.state),
          paint.get('line-gap-width').evaluate(feature, feature.state)
        );

      const lineWidth = styleLineWidth + lineBlur;

      const minX = Math.min(...translatedPolygon.map((v) => v.x - lineWidth / 2)),
        minY = Math.min(...translatedPolygon.map((v) => v.y - lineWidth / 2)),
        maxX = Math.max(...translatedPolygon.map((v) => v.x + lineWidth / 2)),
        maxY = Math.max(...translatedPolygon.map((v) => v.y + lineWidth / 2));

      const mapRect = new MapRect(minX, minY, maxX, maxY),
        interactionPoint = findInteractionPoint(translatedPolygon, feature, mapInterface, visibleMapBBox.projected);

      const display: DisplayRecordBaseFeature = {
        mapRect,
        interactionPoints: interactionPoint ? [interactionPoint] : [],
        isVisible: styleLayer.paint.get('line-opacity').evaluate(feature, feature.state) > 0,
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

function getLineWidth(lineWidth: number, lineGapWidth: number) {
  if (lineGapWidth > 0) {
    return lineGapWidth + 2 * lineWidth;
  } else {
    return lineWidth;
  }
}
