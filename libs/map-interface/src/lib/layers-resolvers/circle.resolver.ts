import { coordAll } from '@turf/meta';
import type { LngLatLike } from 'maplibre-gl';

import { MapInterface } from '../map-interface';
import type {
  DisplayRecordBaseFeature,
  GeoJSONFeature,
  MapInternalType,
  Point,
  PointInterface,
} from '@mapgrab/map-interface-types';
import { MapRect } from '@mapgrab/map-interface-types';
import { ResultFeature } from '../models/result-feature';
import { findInteractionPoint, transformResult, translate } from './utils';

export class CircleLayerResolver {
  static resolve(
    mapInterface: MapInterface,
    features: GeoJSONFeature[],
    visibleMapBBox: { projected: DOMRect; unprojected: [number, number, number, number] }
  ): ResultFeature[] {
    const mapInstance: MapInternalType = mapInterface.map,
      style = mapInstance.style;

    const resolvedFeatures: ResultFeature[] = [];

    features.forEach((feature) => {
      const styleLayer = style._layers[feature.layer!.id],
        project = coordAll(feature.geometry as any).map((cord) => mapInstance.project(cord as LngLatLike));

      const translatedCircle: Point[] = translate(
        project,
        styleLayer.paint.get('circle-translate'),
        styleLayer.paint.get('circle-translate-anchor'),
        mapInstance.transform.angle,
        1
      );

      const isVisible: boolean = styleLayer.paint.get('circle-opacity').evaluate(feature, feature.state) > 0;

      const radius = styleLayer.paint.get('circle-radius').evaluate(feature, feature.state),
        stroke = styleLayer.paint.get('circle-stroke-width').evaluate(feature, feature.state),
        size = radius + stroke,
        translated: [PointInterface, PointInterface] = [
          { x: translatedCircle[0]!.x - size, y: translatedCircle[0]!.y - size },
          { x: translatedCircle[0]!.x + size, y: translatedCircle[0]!.y + size },
        ];

      const mapRect = new MapRect(translated[0].x, translated[0].y, translated[1].x, translated[1].y);

      if (
        mapRect.right <= 0 ||
        mapRect.x >= visibleMapBBox.projected.width ||
        mapRect.y >= visibleMapBBox.projected.bottom ||
        mapRect.bottom <= 0
      )
        return;

      const interactionPoint = findInteractionPoint(translatedCircle, feature, mapInterface, visibleMapBBox.projected);

      const display: DisplayRecordBaseFeature = {
        mapRect,
        isVisible,
        //Click on center
        interactionPoints: interactionPoint ? [interactionPoint] : [],
      };

      resolvedFeatures.push(transformResult(feature, display, visibleMapBBox.projected, mapInterface.mapId));
    });

    return resolvedFeatures;
  }
}
