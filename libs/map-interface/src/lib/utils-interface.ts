import { ElementDimension, UtilsI } from '@mapgrab/map-interface-types';
import { getElementDimensions } from './utils/dimensions';
import { currentFrameAbsolutePosition } from './utils/nested-window';

export class UtilsInterface implements UtilsI {
  public getElementDimensions(el: HTMLElement): ElementDimension {
    return getElementDimensions(el);
  }

  public frameAbsolutePosition(_window: Window): { x: number; y: number } {
    return currentFrameAbsolutePosition(_window);
  }
}
