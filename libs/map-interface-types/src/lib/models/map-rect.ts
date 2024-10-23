import { MapRectInterface } from '../interfaces/map-rect';

export class MapRect implements MapRectInterface {
  public readonly x: number;
  public readonly y: number;
  public readonly right: number;
  public readonly bottom: number;
  public readonly width: number;
  public readonly height: number;

  constructor(minX: number, minY: number, maxX: number, maxY: number) {
    this.x = minX;
    this.y = minY;
    this.right = maxX;
    this.bottom = maxY;
    this.width = maxX - minX;
    this.height = maxY - minY;
  }

  public merge(rectB: MapRectInterface): MapRect {
    const minX = Math.min(this.x, rectB.x),
      minY = Math.min(this.y, rectB.y),
      maxX = Math.max(this.right, rectB.right),
      maxY = Math.max(this.bottom, rectB.bottom);

    return new MapRect(minX, minY, maxX, maxY);
  }

  public applyPadding(padding: number | [number] | [number, number] | [number, number, number, number]): MapRect {
    const [yPadding, rightPadding, bottomPadding, xPadding] =
      Array.isArray(padding) && padding.length === 4
        ? padding
        : Array.isArray(padding) && padding.length === 2
        ? [padding[0], padding[1], padding[0], padding[1]]
        : Array.isArray(padding) && padding.length === 1
        ? [padding[0], padding[0], padding[0], padding[0]]
        : [padding, padding, padding, padding];

    return new MapRect(
      this.x - xPadding,
      this.y - yPadding,
      this.right + xPadding + rightPadding,
      this.bottom + yPadding + bottomPadding
    );
  }

  public applyOffset(offset: number | [number, number]): MapRect {
    const [xOffset, yOffset] = Array.isArray(offset) ? offset : [offset, offset];

    return new MapRect(this.x + xOffset, this.y + yOffset, this.right + xOffset, this.bottom + yOffset);
  }
}
