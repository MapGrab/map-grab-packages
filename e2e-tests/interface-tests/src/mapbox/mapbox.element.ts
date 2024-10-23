import { installMapGrab } from '@mapgrab/map-interface';
import * as mapbox from 'mapbox-gl';

import './mapbox.element.scss';

export class MapboxElement extends HTMLElement {
  public static observedAttributes = [];

  connectedCallback() {
    this.innerHTML = `<div id="map"></div>`;

    const map = new mapbox.Map({
      accessToken: process.env.MAPBOX_ACCESS_TOKEN!,
      container: 'map',
      style: 'https://demotiles.maplibre.org/style.json',
      center: [0, 0],
      zoom: 1,
      clickTolerance: 5,
    });

    installMapGrab(map, 'mainMap');
    map.on('click', 'lines', console.log);

    map.showCollisionBoxes = true;
    // map.showTileBoundaries = true;
  }
}
customElements.define('app-mapbox', MapboxElement);
