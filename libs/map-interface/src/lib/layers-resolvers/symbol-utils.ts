//@ts-nocheck
import type { StyleLayer, SourceCache, QueryRenderedFeaturesOptions, RetainedQueryData } from 'maplibre-gl';
import { MapEngine, type Point } from '@mapgrab/map-interface-types';
import { MapInterface } from '../map-interface';

function sortTilesIn(a, b) {
  const idA = a.tileID;
  const idB = b.tileID;
  return (
    idA.overscaledZ - idB.overscaledZ ||
    idA.canonical.y - idB.canonical.y ||
    idA.wrap - idB.wrap ||
    idA.canonical.x - idB.canonical.x
  );
}

export function queryRenderedSymbols(
  mapInterface: MapInterface,
  styleLayers: { [_: string]: StyleLayer },
  serializedLayers: { [_: string]: StyleLayer },
  sourceCaches: { [_: string]: SourceCache },
  queryGeometry: Array<Point>,
  params: QueryRenderedFeaturesOptions,
  collisionIndex: any,
  retainedQueryData: {
    [_: number]: RetainedQueryData;
  }
) {
  const result = {};
  const renderedSymbols = collisionIndex.queryRenderedSymbols(queryGeometry);
  const bucketQueryData = [];
  for (const bucketInstanceId of Object.keys(renderedSymbols).map(Number)) {
    bucketQueryData.push(retainedQueryData[bucketInstanceId]);
  }
  bucketQueryData.sort(sortTilesIn);

  for (const queryData of bucketQueryData) {
    const bucketSymbols = queryData.featureIndex.lookupSymbolFeatures(
      renderedSymbols[queryData.bucketInstanceId],
      serializedLayers,
      queryData.bucketIndex,
      queryData.sourceLayerIndex,
      params.filter,
      params.layers ? mapInterface.mapEngine === MapEngine.MapLibre ? new Set(params.layers) : params.layers : undefined,
      params.availableImages,
      styleLayers
    );

    for (const layerID in bucketSymbols) {
      const resultFeatures = (result[layerID] = result[layerID] || []);
      const layerSymbols = bucketSymbols[layerID];
      layerSymbols.sort((a, b) => {
        // Match topDownFeatureComparator from FeatureIndex, but using
        // most recent sorting of features from bucket.sortFeatures
        const featureSortOrder = queryData.featureSortOrder;
        if (featureSortOrder) {
          // queryRenderedSymbols documentation says we'll return features in
          // "top-to-bottom" rendering order (aka last-to-first).
          // Actually there can be multiple symbol instances per feature, so
          // we sort each feature based on the first matching symbol instance.
          const sortedA = featureSortOrder.indexOf(a.featureIndex);
          const sortedB = featureSortOrder.indexOf(b.featureIndex);
          return sortedB - sortedA;
        } else {
          // Bucket hasn't been re-sorted based on angle, so use the
          // reverse of the order the features appeared in the data.
          return b.featureIndex - a.featureIndex;
        }
      });
      for (const symbolFeature of layerSymbols) {
        resultFeatures.push({
          ...symbolFeature,
          bucketInstanceId: queryData.bucketInstanceId,
          tileID: queryData.tileID,
        });
      }
    }
  }

  // Merge state from SourceCache into the results
  for (const layerName in result) {
    result[layerName].forEach((featureWrapper) => {
      const feature = featureWrapper.feature;
      const layer = styleLayers[layerName];
      const sourceCache = sourceCaches[layer.source] || sourceCaches[`symbol:${layer.source}`];
      const state = sourceCache.getFeatureState(feature.layer['source-layer'], feature.id);
      feature.source = feature.layer.source;
      if (feature.layer['source-layer']) {
        feature.sourceLayer = feature.layer['source-layer'];
      }
      feature.state = state;
    });
  }
  return result;
}
