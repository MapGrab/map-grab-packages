import { MapGrabEvents } from '@mapgrab/map-interface-types';

import type {
  MapControllerInterface as MapGrabControllerInterface,
  SetViewOptions,
  LngLatBoundsLike,
  FitBoundsOptions,
  ExposeMutationResult,
  MapType,
  MapRectInterface,
  MapGrabPublicInterfaceI,
  MapInterfaceI,
  LngLatInterface,
  PointLike,
  PointInterface,
} from '@mapgrab/map-interface-types';

export class MapController {
  constructor(
    protected readonly cy: Cypress.cy,
    protected readonly _window: Window,
    protected readonly mapId: string
  ) {}

  public setView(options: SetViewOptions) {
    return this.executeOnController((controller) => {
      controller.setView(options);
    });
  }

  public setViewAbsolute(options: SetViewOptions) {
    return this.executeOnController((controller) => {
      controller.setViewAbsolute(options);
    });
  }

  public fitMapToBounds(bounds: LngLatBoundsLike, options?: FitBoundsOptions) {
    return this.executeOnController((controller) => {
      controller.fitMapToBounds(bounds, options);
    });
  }

  public fitMapToBoundingBox(bbox: MapRectInterface, options?: FitBoundsOptions) {
    return this.executeOnController((controller) => {
      controller.fitMapToBoundingBox(bbox, options);
    });
  }

  public exposeLayers(
    layersToExpose: string[],
    layersToHide: string[] | 'allOther' = 'allOther'
  ): Cypress.Chainable<ExposeMutationResult> {
    return this.executeOnController((controller) => {
      return controller.exposeLayers(layersToExpose, layersToHide);
    });
  }

  public revertExposeLayers(exposeMutationState: ExposeMutationResult): Cypress.Chainable<void> {
    return this.executeOnController((controller) => {
      return controller.revertExposeLayers(exposeMutationState);
    });
  }

  public setBackgroundColor(backgroundColor: string): Cypress.Chainable<void> {
    return this.executeOnController((controller) => {
      return controller.setBackgroundColor(backgroundColor);
    });
  }

  public removeBackground(): Cypress.Chainable<void> {
    return this.executeOnController((controller) => {
      return controller.removeBackground();
    });
  }

  public projectLngLatToScreenPoint(lngLat: LngLatInterface): Cypress.Chainable<PointLike> {
    return this.executeOnController((controller) => {
      return controller.projectLngLatToScreenPoint(lngLat);
    });
  }

  public unprojectLngLatToScreenPoint(point: PointInterface): Cypress.Chainable<LngLatInterface> {
    return this.executeOnController((controller) => {
      return controller.unprojectScreenPointToLngLat(point);
    });
  }

  public waitToMapLoaded(opts?: { timeout?: number }) {
    return this.getMapController().then((c) => this.cy.wrap(c.waitToMapLoaded(), opts));
  }

  public waitToMapRepaint(opts?: { timeout?: number }) {
    return this.getMapController().then((c) => this.cy.wrap(c.waitToMapRepaint(), opts));
  }

  public waitToMapStable(opts?: { timeout?: number }) {
    return this.getMapController().then((map) => this.cy.wrap(map.waitToMapStable(), opts));
  }

  public getMapInstance(): Cypress.Chainable<MapType> {
    return this.getMapInterface().then((i) => i.map);
  }

  public getMapController(): Cypress.Chainable<MapGrabControllerInterface> {
    return this.getMapInterface().then((i) => i.controller);
  }

  public enableInspector() {
    return this.getWindow().then(() => {
      return this.getMapGrabHandle().then((mapGrab) => {
        mapGrab.enableInspector();
      });
    });
  }

  public disableInspector() {
    return this.getWindow().then(() => {
      return this.getMapGrabHandle().then((mapGrab) => {
        mapGrab.disableInspector();
      });
    });
  }

  public getMapInterface(): Cypress.Chainable<MapInterfaceI> {
    return this.getWindow().then((_window) => {
      return this.getMapGrabHandle().then((mapGrab): Cypress.Chainable<MapInterfaceI> => {
        const getInterface = () => mapGrab.getMapInterface(this.mapId),
          currentInterface = getInterface();

        if (currentInterface) {
          return this.cy.wrap(currentInterface, { log: false });
        }

        return this.cy.wrap<Promise<MapInterfaceI>, MapInterfaceI>(
          new Promise<MapInterfaceI>((resolve) => {
            const handler = () => {
              const currentInterface = getInterface();

              if (currentInterface) {
                _window.removeEventListener(MapGrabEvents.MAP_INTERFACE_INIT, handler);

                resolve(currentInterface);

                return;
              }
            };

            _window.addEventListener(MapGrabEvents.MAP_INTERFACE_INIT, handler);
            handler();
          }),
          { log: false }
        );
      });
    });
  }

  public getMapGrabHandle(): Cypress.Chainable<MapGrabPublicInterfaceI> {
    return this.getWindow().its('__MAPGRAB__', { log: false });
  }

  protected getWindow(): Cypress.Chainable<Window> {
    return this.cy.wrap(this._window, { log: false });
  }

  protected executeOnController(callback: (controller: MapGrabControllerInterface) => any | Cypress.Chainable<any>) {
    return this.waitToMapLoaded().then(() => {
      return this.getMapController().then((controller) => {
        const result = callback(controller);

        return this.cy
          .wrap(result, { log: false })
          .then(() => this.waitToMapStable())
          .then(() => result);
      });
    });
  }
}
