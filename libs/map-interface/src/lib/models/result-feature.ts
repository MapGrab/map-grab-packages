import { MapRectInterface, ResultFeatureInterface } from '@mapgrab/map-interface-types';

export class ResultFeature implements ResultFeatureInterface {
  constructor(
    public readonly featureId: number | string | undefined,
    public readonly sourceId: string,
    public readonly layerId: string,
    public readonly properties: Record<string, any>,
    public readonly mapId: string,
    public readonly isVisible: boolean,
    public readonly interactionPoints: { x: number; y: number }[],
    public readonly rect: MapRectInterface
  ) {}
}
