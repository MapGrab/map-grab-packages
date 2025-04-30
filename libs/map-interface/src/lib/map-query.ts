import type { FilterSpecification, LayerSpecification } from 'maplibre-gl';

import { CircleLayerResolver } from './layers-resolvers/circle.resolver';
import { FillLayerResolver } from './layers-resolvers/fill.resolver';
import { LineLayerResolver } from './layers-resolvers/line.resolver';
import { SymbolLayerResolver } from './layers-resolvers/symbol.resolver';
import { getVisibleMapBBox } from './layers-resolvers/utils';
import type { MapInterface } from './map-interface';
import type { ResultFeature } from './models/result-feature';
import type { GeoJSONFeature, PointLike } from '@mapgrab/map-interface-types';
import { groupBy } from './utils/collection';

export class MapQuery {
  public static queryMap(
    mapInterface: MapInterface,
    opts: {
      layerIds?: string[] | undefined;
      filter?: FilterSpecification | undefined;
      queryGeometry?: PointLike | undefined;
    }
  ): ResultFeature[] {
    const queryFeatures: GeoJSONFeature[] = mapInterface.map.queryRenderedFeatures(
        //@ts-ignore
        opts.queryGeometry,
        {
          ...(opts.layerIds ? { layers: opts.layerIds } : {}),
          ...(opts.filter ? { filter: opts.filter } : {}),
        }
      ),
      groupedFeatures: { [key in LayerSpecification['type']]?: GeoJSONFeature[] } = groupBy(
        queryFeatures,
        ({ layer }) => layer?.type || 'undef'
      ),
      visibleMapBBox = getVisibleMapBBox(mapInterface.map);

    const bounds = mapInterface.map.getBounds()!;

    const mapBounds: [number, number, number, number] = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ];

    const mapbbpx = {
      projected: visibleMapBBox,
      unprojected: mapBounds,
    };

    return Object.entries(groupedFeatures).reduce<ResultFeature[]>((acc, [layerGroupType, groupFeatures]) => {
      let resolvedFeatures: ResultFeature[] = [];

      if (layerGroupType === 'fill') {
        resolvedFeatures = FillLayerResolver.resolve(mapInterface, groupFeatures, mapbbpx);
      } else if (layerGroupType === 'symbol') {
        resolvedFeatures = SymbolLayerResolver.resolve(
          mapInterface,
          opts.layerIds,
          opts.filter,
          opts.queryGeometry,
          visibleMapBBox
        );
      } else if (layerGroupType === 'line') {
        resolvedFeatures = LineLayerResolver.resolve(mapInterface, groupFeatures, mapbbpx);
      } else if (layerGroupType === 'circle') {
        resolvedFeatures = CircleLayerResolver.resolve(mapInterface, groupFeatures, mapbbpx);
      }

      return [...acc, ...resolvedFeatures];
    }, []);
  }
}
