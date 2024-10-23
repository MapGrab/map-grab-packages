import { MapGrabEvents } from '@mapgrab/map-interface-types';

window.addEventListener(MapGrabEvents.MAP_INTERFACE_INIT, () => {
  chrome.runtime.sendMessage(MapGrabEvents.MAP_INTERFACE_INIT);
});
