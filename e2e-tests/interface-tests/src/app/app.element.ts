import { installMapGrab } from '@mapgrab/map-interface';
import { Map } from 'maplibre-gl';

import './app.element.scss';

export class AppElement extends HTMLElement {
  public static observedAttributes = [];

  connectedCallback() {
    this.innerHTML = `
    <div id="map-1">
    </div>
      `;

    setTimeout(() => {
      const map = new Map({
        container: 'map-1',
        style: 'https://demotiles.maplibre.org/style.json',
        center: [0, 0],
        zoom: 1,
        attributionControl: false,
        clickTolerance: 5,
      });

      map.on('click', 'lines', console.log);

      map.showCollisionBoxes = true;
      // map.showTileBoundaries = true;
      installMapGrab(map, 'mainMap');

      map.on('load', () => {
        map.addSource('floorplan', {
          // GeoJSON Data source used in vector tiles, documented at
          // https://gist.github.com/ryanbaumann/a7d970386ce59d11c16278b90dde094d
          type: 'geojson',
          data: 'https://maplibre.org/maplibre-gl-js/docs/assets/indoor-3d-map.geojson',
        });
        map.addLayer({
          id: 'room-extrusion',
          type: 'fill-extrusion',
          source: 'floorplan',
          paint: {
            // See the MapLibre Style Specification for details on data expressions.
            // https://maplibre.org/maplibre-style-spec/expressions/

            // Get the fill-extrusion-color from the source 'color' property.
            'fill-extrusion-color': ['get', 'color'],

            // Get fill-extrusion-height from the source 'height' property.
            'fill-extrusion-height': ['get', 'height'],

            // Get fill-extrusion-base from the source 'base_height' property.
            'fill-extrusion-base': ['get', 'base_height'],

            // Make extrusions slightly opaque for see through indoor walls.
            'fill-extrusion-opacity': 0.5,
          },
        });
      });
    }, 0);

    // map.on('load', () => {
    //   // Add a source and layer displaying a point which will be animated in a circle.
    //   map.addSource('point', {
    //     type: 'geojson',
    //     data: pointOnCircle(0),
    //   });

    //   map.addLayer({
    //     id: 'point',
    //     source: 'point',
    //     type: 'circle',
    //     paint: {
    //       'circle-radius': 10,
    //       'circle-color': '#007cbf',
    //     },
    //   });

    //   function animateMarker(timestamp) {
    //     // Update the data to a new position based on the animation timestamp. The
    //     // divisor in the expression `timestamp / 1000` controls the animation speed.
    //     map.getSource('point').setData(pointOnCircle(timestamp / 1000));

    //     // Request the next frame of the animation.
    //     requestAnimationFrame(animateMarker);
    //   }

    //   // Start the animation.
    //   animateMarker(0);
    // });
  }
}
customElements.define('app-root', AppElement);
