import {
  ExposeMutationResult,
  FitBoundsOptions,
  LngLatBoundsLike,
  LngLatLike,
  MapControllerInterface,
  MapRectInterface,
  SetViewOptions,
} from '@mapgrab/map-interface-types';

import type { CenterLike, LngLatInterface, MapType, PointInterface } from '@mapgrab/map-interface-types';

export class MapLibreMapController<MapI extends MapType> implements MapControllerInterface {
  constructor(private readonly map: MapI) {}

  public waitToMapLoaded(): Promise<boolean> | boolean {
    const isLoaded = () => this.map && (this.map as any)._loaded;

    if (isLoaded()) {
      return true;
    }

    return new Promise((resolve) => {
      const checkMapLoaded = () => {
        if (isLoaded()) {
          //@ts-ignore
          this.map.off('load', checkMapLoaded);
          resolve(true);
          return;
        } else {
          //@ts-ignore
          this.map.on('load', checkMapLoaded);
        }
      };

      checkMapLoaded();
    });
  }

  public waitToMapStable(): Promise<void> | void {
    return this._waitToMapStable({ shouldRepaint: false });
  }

  public waitToMapRepaint(): Promise<void> | void {
    return this._waitToMapStable({ shouldRepaint: true });
  }

  private _waitToMapStable(opts: { shouldRepaint: boolean }): Promise<void> | void {
    const map = this.map;

    const isStable = () =>
      !map.isMoving() &&
      !map.isZooming() &&
      !map.isEasing() &&
      //@ts-ignore
      map.style.loaded() &&
      map.areTilesLoaded() &&
      //@ts-ignore
      !map._styleDirty &&
      //@ts-ignore
      !map._sourcesDirty &&
      //@ts-ignore
      !map._frameRequest &&
      //@ts-ignore
      !map._placementDirty &&
      //@ts-ignore
      !map._repaint &&
      // https://github.com/maplibre/maplibre-gl-js/blob/8e74a6b0e9a76e75379a184fbc8b94cdf41de4e9/src/ui/handler/scroll_zoom.ts#L171
      //@ts-ignore
      (!map.scrollZoom._lastWheelEventTime || performance.now() - map.scrollZoom._lastWheelEventTime > 40);

    if (isStable() && !opts.shouldRepaint) {
      return;
    }

    return new Promise((resolve) => {
      const check = () => {
        const maybeResovle = () => {
          if (isStable()) {
            //@ts-ignore
            map.off('idle', maybeResovle);
            resolve();
            return;
          } else {
            check();
            return;
          }
        };

        //@ts-ignore
        if (!opts.shouldRepaint) {
          // if there are animated elements on the map then the idle event may never be emitted
          setTimeout(maybeResovle, map._fadeDuration);
        }
        //@ts-ignore
        map.on('idle', maybeResovle);
      };

      check();
    });
  }

  public setView(options: SetViewOptions): void {
    this.map.jumpTo(options);
  }

  public setViewAbsolute(options: SetViewOptions & { center: PointInterface | CenterLike }): void {
    this.map.jumpTo({ ...options, ...(options.center ? { center: this.map.unproject(options.center) } : {}) });
  }

  public fitMapToBounds(bounds: LngLatBoundsLike, options?: FitBoundsOptions) {
    this.map.fitBounds(bounds, { animate: false, ...options });
  }

  public fitMapToBoundingBox(bbox: MapRectInterface, options?: FitBoundsOptions) {
    const map = this.map;

    const { x, y } = map.getCanvasContainer().getBoundingClientRect();

    const sw = map.unproject([bbox.x - x, bbox.y - y + bbox.height]);
    const ne = map.unproject([bbox.x - x + bbox.width, bbox.y - y]);

    map.fitBounds([sw, ne], { animate: false, ...options });
  }

  public exposeLayers(layersToExpose: string[], layersToHide: string[] | 'allOther'): ExposeMutationResult {
    const map = this.map;

    const styleLayers = map.getStyle()?.layers ?? [];
    const mutationState: ExposeMutationResult = {};

    styleLayers.forEach((layer) => {
      const toState: 'visible' | 'none' = layersToExpose.includes(layer.id)
        ? 'visible'
        : typeof layersToHide === 'string' && layersToHide === 'allOther'
        ? 'none'
        : layersToHide.includes(layer.id)
        ? 'none'
        : 'visible';

      const currentState = map.getLayoutProperty(layer.id, 'visibility') || 'visible';

      if (currentState != toState) {
        mutationState[layer.id] = { from: currentState, to: toState };
        map.setLayoutProperty(layer.id, 'visibility', toState);
      }
    });

    return mutationState;
  }

  public revertExposeLayers(exposeMutationState: ExposeMutationResult): void {
    for (const [layerId, { from }] of Object.entries(exposeMutationState)) {
      this.map.setLayoutProperty(layerId, 'visibility', from);
    }
  }

  public setBackgroundColor(backgroundColor: string): void {
    const map = this.map;

    const styleLayers = map.getStyle()?.layers ?? [];

    if (map.getLayer('___mapgrab__background__')) {
      return;
    }

    map.addLayer(
      {
        id: '___mapgrab__background__',
        type: 'background',
        paint: { 'background-color': backgroundColor },
      },
      styleLayers[0]?.id
    );
  }

  public removeBackground(): void {
    const map = this.map;

    if (!map.getLayer('___mapgrab__background__')) {
      return;
    }

    map.removeLayer('___mapgrab__background__');
  }

  public projectLngLatToScreenPoint(lngLat: LngLatLike): PointInterface {
    const { x, y } = this.map.project(lngLat);
    const { x: mapX, y: mapY } = this.map.getCanvasContainer().getBoundingClientRect();

    return { x: Math.round(x + mapX), y: Math.round(y + mapY) };
  }

  public unprojectScreenPointToLngLat(point: PointInterface): LngLatInterface {
    const { x: mapX, y: mapY } = this.map.getCanvasContainer().getBoundingClientRect();

    return this.map.unproject([point.x - mapX, point.y - mapY]);
  }
}
