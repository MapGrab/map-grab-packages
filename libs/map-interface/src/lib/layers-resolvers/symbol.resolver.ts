import type { FilterSpecification, MapGeoJSONFeature, Map as MapLibreMap } from 'maplibre-gl';

import { MapInterface } from '../map-interface';
import { type DisplayRecordBaseFeature, MapEngine, Point, type PointLike } from '@mapgrab/map-interface-types';
import { MapRect } from '@mapgrab/map-interface-types';
import { ResultFeature } from '../models/result-feature';
import { queryRenderedSymbols } from './symbol-utils';
import { findInteractionPoint, transformResult } from './utils';

export class SymbolLayerResolver {
  static resolve(
    mapInterface: MapInterface,
    layerIds: string[] | undefined,
    filter: FilterSpecification | undefined,
    queryGeometryI: PointLike | undefined,
    visibleMapBBox: DOMRect
  ): ResultFeature[] {
    const style = (mapInterface.map as MapLibreMap).style;

    //Query symbols
    const geometry: [PointLike, PointLike] = queryGeometryI
      ? [queryGeometryI, queryGeometryI]
      : [
          [0, 0],
          [(mapInterface.map as MapLibreMap).transform.width, (mapInterface.map as MapLibreMap).transform.height],
        ];

    const tl = Point.convert(geometry[0] as PointLike),
      br = Point.convert(geometry[1] as PointLike),
      queryGeometry = [tl, new Point(br.x, tl.y), br, new Point(tl.x, br.y), tl];

    const renderedSymbols: {
      [key in string]: [{ bucketInstanceId: number; featureIndex: number; feature: MapGeoJSONFeature }];
    } = queryRenderedSymbols(
      mapInterface,
      style._layers,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore:next-line
      style._serializedAllLayers ? style._serializedAllLayers() : style._serializedLayers,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore:next-line
      style.sourceCaches || style._sourceCaches,
      //@ts-ignore
      queryGeometry,
      {
        ...(layerIds ? { layers: layerIds } : {}),
        ...(filter ? { filter: filter } : {}),
      },
      style.placement.collisionIndex,
      style.placement.retainedQueryData
    );

    const features: ResultFeature[] = [];

    for (const layerID in renderedSymbols) {
      renderedSymbols[layerID]!.forEach((symbol) => {
        const collisionGridIds: number[] = (
          mapInterface.map as MapLibreMap
        ).style.placement.collisionIndex.grid.boxKeys.reduce((acc, x, index) => {
          if (x.bucketInstanceId === symbol.bucketInstanceId && x.featureIndex === symbol.featureIndex) {
            acc.push(index);
          }

          return acc;
        }, [] as number[]);

        const featuress: {
          bbox: [number, number, number, number];
          circlePoints?: [number, number][];
          radius?: number;
        }[] = [];
        let featureIndex = 0;
        const styleLayer: any = style._layers[symbol.feature.layer.id]!.paint;

        // When collision box grid not exists check circle grid
        if (collisionGridIds.length === 0) {
          const circleIndex = (mapInterface.map as MapLibreMap).style.placement.collisionIndex.grid.circles;
          const circleKeys = (mapInterface.map as MapLibreMap).style.placement.collisionIndex.grid.circleKeys;

          const elementsCount = circleIndex.length;

          for (const [index, circleKey] of circleKeys.entries()) {
            if (
              circleKey.bucketInstanceId === symbol.bucketInstanceId &&
              circleKey.featureIndex === symbol.featureIndex
            ) {
              const indexId = index * 3;
              //-100px offset
              const circlePoint = [circleIndex[indexId], circleIndex[indexId + 1]].map((v) => Math.round(v! - 100)) as [
                number,
                number
              ];
              const radius = circleIndex[indexId + 2]!;

              if (
                circlePoint[0] + radius >= 0 &&
                circlePoint[0] - radius <= visibleMapBBox.width &&
                circlePoint[1] + radius >= 0 &&
                circlePoint[1] - radius <= visibleMapBBox.height
              ) {
                if (!featuress[featureIndex]) {
                  featuress[featureIndex] = { bbox: [0, 0, 0, 0], circlePoints: [], radius: radius };
                }

                featuress[featureIndex]!.circlePoints!.push(circlePoint);
              }

              if ((index + 1) * 3 < elementsCount) {
                const nextCircleIndexId = (index + 1) * 3,
                  nextCircleRadius: number = circleIndex[nextCircleIndexId + 2]!,
                  nextCirclePoint = [circleIndex[nextCircleIndexId], circleIndex[nextCircleIndexId + 1]].map((v) =>
                    Math.round(v! - 100)
                  ) as [number, number];

                const toNextCircleDistance = getDistance(
                  circlePoint[0],
                  circlePoint[1],
                  nextCirclePoint[0],
                  nextCirclePoint[1]
                );

                if (featuress[featureIndex] && toNextCircleDistance - nextCircleRadius - radius > 5) {
                  featureIndex += 1;
                } else {
                  // featuress[featureIndex]!.circlePoints!.push(circlePoint);
                  // bboxes.push(circlePoint);
                }
              } else {
                // bboxes.push(circlePoint);
              }
            }
          }

          featuress.forEach((feature) => {
            const { circlePoints, radius } = feature;

            if (circlePoints && circlePoints.length > 0 && radius) {
              const minX = Math.min(...circlePoints!.map((v) => v[0] - radius!));
              const minY = Math.min(...circlePoints!.map((v) => v[1]! - radius!));
              const maxX = Math.max(...circlePoints!.map((v) => v[0]! + radius!));
              const maxY = Math.max(...circlePoints!.map((v) => v[1]! + radius!));

              feature.bbox = [minX, minY, maxX, maxY];
            }
          });
        } else {
          let bboxes = collisionGridIds.map((collisionGridId) => {
            return (mapInterface.map as MapLibreMap).style.placement.collisionIndex.grid.bboxes
              .slice(collisionGridId * 4, collisionGridId * 4 + 4)
              .map((v) => Math.round(v - 100)) as [number, number, number, number];
          });

          if (mapInterface.mapEngine === MapEngine.MapBox) {
            bboxes = bboxes.map((bbox, index) => {
              const translate =
                bboxes.length > 1 && index === 0 ? styleLayer.get('text-translate') : styleLayer.get('icon-translate');

              return [bbox[0] + translate[0], bbox[1] + translate[1], bbox[2] + translate[0], bbox[3] + translate[1]];
            });
          }

          const minX = Math.min(...bboxes!.map((v) => v[0]));
          const minY = Math.min(...bboxes!.map((v) => v[1]!));
          const maxX = Math.max(...bboxes!.map((v) => v[2]!));
          const maxY = Math.max(...bboxes!.map((v) => v[3]!));

          featuress[featureIndex] = {
            bbox: [minX, minY, maxX, maxY],
          };
        }

        const featuresToPush = featuress.map(({ bbox, circlePoints }) => {
          const width = bbox[2] - bbox[0],
            height = bbox[3] - bbox[1],
            interactionPoint: [number, number] =
              circlePoints && circlePoints[0]
                ? [Math.round(circlePoints[0][0]), Math.round(circlePoints[0][1])]
                : [Math.round(bbox[0] + width / 2), Math.round(bbox[1] + height / 2)];

          const mapRect = new MapRect(...bbox);
          const interactionPointAbility = findInteractionPoint(
            [new Point(...interactionPoint)],
            symbol.feature,
            mapInterface,
            visibleMapBBox
          );

          const display: DisplayRecordBaseFeature = {
            mapRect,
            interactionPoints: interactionPointAbility ? [interactionPointAbility] : [],
            isVisible:
              styleLayer.get('icon-opacity').evaluate(symbol.feature, symbol.feature.state) > 0 ||
              styleLayer.get('text-opacity').evaluate(symbol.feature, symbol.feature.state) > 0,
          };

          return transformResult(symbol.feature, display, visibleMapBBox, mapInterface.mapId);
        });

        features.push(...featuresToPush);
      });
    }

    return features;
  }
}

function getDistance(x1: number, y1: number, x2: number, y2: number): number {
  const y = x2 - x1;
  const x = y2 - y1;

  return Math.sqrt(x * x + y * y);
}
