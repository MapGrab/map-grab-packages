export interface MapRectInterface {
  x: number;
  y: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  merge(rect: MapRectInterface): MapRectInterface;
}
