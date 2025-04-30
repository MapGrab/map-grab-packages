import { getElementDimensions } from './dimensions';

export function currentFrameAbsolutePosition(_window: Window) {
  let currentWindow = _window;
  let currentParentWindow;
  const positions: { x: number; y: number }[] = [];

  while (currentWindow !== window.top) {
    currentParentWindow = currentWindow.parent;
    for (let idx = 0; idx < currentParentWindow.frames.length; idx++)
      if (currentParentWindow.frames[idx] === currentWindow) {
        for (const frameElement of currentParentWindow.document.getElementsByTagName('iframe')) {
          if (frameElement.contentWindow === currentWindow && !frameElement.classList.contains('aut-iframe')) {
            const rect = getElementDimensions(frameElement);

            positions.push({ x: rect.offset.left + rect.borderLeft, y: rect.offset.top + rect.borderTop });
          }
        }
        currentWindow = currentParentWindow;
        break;
      }
  }
  return positions.reduce(
    (accumulator, currentValue) => {
      return {
        x: accumulator.x + currentValue.x,
        y: accumulator.y + currentValue.y,
      };
    },
    { x: 0, y: 0 }
  );
}
