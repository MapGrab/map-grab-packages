export interface UtilsI {
  getElementDimensions(el: HTMLElement): ElementDimension;
  frameAbsolutePosition(_window: Window): { x: number; y: number };
}

export type ElementDimension = {
  offset: { top: number; left: number };

  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  borderTop: number;
  borderRight: number;
  borderBottom: number;
  borderLeft: number;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;

  width: number;
  height: number;

  heightWithPadding: number;
  heightWithBorder: number;
  heightWithMargin: number;
  widthWithPadding: number;
  widthWithBorder: number;
  widthWithMargin: number;
};
