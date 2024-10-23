import { MapRectInterface, ResultFeatureInterface } from '@mapgrab/map-interface-types';

export type SingleResult = ResultFeatureInterface;

export type MergedResult = {
  features: ResultFeatureInterface[];
  rect: MapRectInterface;
  interactionPoints: ResultFeatureInterface['interactionPoints'];
};

export type SingleLocatorQueryResult = SingleResult | MergedResult;

export type LocatorQueryResult = Array<SingleLocatorQueryResult>;
