import {
  ExposeMutationResult,
  FitBoundsOptions,
  LngLatBoundsLike,
  LngLatInterface,
  MapControllerInterface,
  MapGrabEvents,
  MapInterfaceI,
  MapRectInterface,
  MapType,
  PointInterface,
  PointLike,
  SetViewOptions,
} from '@mapgrab/map-interface-types';
import { errors, type JSHandle, type Locator, type Page } from '@playwright/test';

export class MapController {
  protected mapInterfaceHandle?: JSHandle<MapInterfaceI>;
  protected evaluateElement: Locator;

  constructor(protected page: Page, protected mapId: string) {
    this.evaluateElement = this.page.locator('html');
  }

  public onIframe(iframeLocator: string | Locator): MapController {
    this.evaluateElement =
      typeof iframeLocator === 'string' ? this.page.frameLocator(iframeLocator).locator('html') : iframeLocator;

    return this;
  }

  public async enableInspector(): Promise<void> {
    await this.getMapInterface();

    await this.page.evaluate(() => window.__MAPGRAB__.enableInspector());
  }

  public async disableInspector(): Promise<void> {
    await this.getMapInterface();

    await this.page.evaluate(() => window.__MAPGRAB__.disableInspector());
  }

  public async setView(options: SetViewOptions): Promise<void> {
    await this.evaluateOnController(
      (controller, { options }) => {
        controller.setView(options);
      },
      { args: { options } }
    );
  }

  public async setViewAbsolute(options: SetViewOptions): Promise<void> {
    await this.evaluateOnController(
      (controller, { options }) => {
        controller.setViewAbsolute(options);
      },
      { args: { options } }
    );
  }

  public async fitMapToBounds(bounds: LngLatBoundsLike, options?: FitBoundsOptions): Promise<void> {
    await this.waitToMapLoaded();
    await this.evaluateOnController(
      (controller, { bounds, options }) => {
        controller.fitMapToBounds(bounds, options);
      },
      { args: { bounds, options } }
    );
  }

  public async fitMapToBoundingBox(bbox: MapRectInterface, options?: FitBoundsOptions): Promise<void> {
    await this.evaluateOnController(
      (controller, { bbox, options }) => {
        controller.fitMapToBoundingBox(bbox, options);
      },
      { args: { bbox, options } }
    );
  }

  public async exposeLayers(
    layersToExpose: string[],
    layersToHide: string[] | 'allOther' = 'allOther'
  ): Promise<ExposeMutationResult> {
    await this.waitToMapStable();
    return await this.evaluateOnController(
      (controller, { layersToExpose, layersToHide }) => controller.exposeLayers(layersToExpose, layersToHide),
      { args: { layersToExpose, layersToHide } }
    );
  }

  public async revertExposeLayers(exposeMutationState: ExposeMutationResult): Promise<void> {
    await this.waitToMapStable();
    await this.evaluateOnController(
      (controller, exposeMutationState) => {
        controller.revertExposeLayers(exposeMutationState);
      },
      {
        args: exposeMutationState,
      }
    );
  }

  public async setBackgroundColor(backgroundColor: string): Promise<void> {
    await this.evaluateOnController(
      (controller, backgroundColor) => {
        controller.setBackgroundColor(backgroundColor);
      },
      {
        args: backgroundColor,
      }
    );
  }

  public async removeBackground(): Promise<void> {
    await this.evaluateOnController((controller) => {
      controller.removeBackground();
    });
  }

  public async projectLngLatToScreenPoint(lngLat: LngLatInterface): Promise<PointLike> {
    await this.waitToMapStable();

    return await this.evaluateOnController((controller, lngLat) => controller.projectLngLatToScreenPoint(lngLat), {
      args: lngLat,
    });
  }

  public async unprojectLngLatToScreenPoint(point: PointInterface): Promise<LngLatInterface> {
    await this.waitToMapStable();

    return await this.evaluateOnController((controller, point) => controller.unprojectScreenPointToLngLat(point), {
      args: point,
    });
  }

  public async waitToMapLoaded(opts?: { timeout?: number }): Promise<void> {
    await this.evaluateOnController((controller) => controller.waitToMapLoaded(), {
      options: opts,
    });
  }

  public async waitToMapStable(opts?: { timeout?: number }): Promise<void> {
    await this.evaluateOnController((controller) => controller.waitToMapStable(), {
      options: opts,
    });
  }

  public async waitToMapRepaint(opts?: { timeout?: number }): Promise<void> {
    await this.evaluateOnController((controller) => controller.waitToMapRepaint(), {
      options: opts,
    });
  }

  public async getMapInstance(): Promise<JSHandle<MapType>> {
    const mapInterface = await this.getMapInterface();

    return await mapInterface.evaluateHandle((mapInterface) => mapInterface.map);
  }

  public async getMapController(): Promise<JSHandle<MapControllerInterface>> {
    const mapInterface = await this.getMapInterface();

    return await mapInterface.evaluateHandle((mapInterface) => mapInterface.controller);
  }

  public async getMapInterface(): Promise<JSHandle<MapInterfaceI>> {
    if (this.mapInterfaceHandle) {
      return this.mapInterfaceHandle;
    }

    await this.evaluateElement.locator(`[data-mapgrab-map-id="${this.mapId}"]`).waitFor({ state: 'attached' });

    this.mapInterfaceHandle = await this.evaluateElement.evaluateHandle(
      (_, { mapId }) => {
        if (window.__MAPGRAB__ && window.__MAPGRAB__.getMapInterface(mapId)) {
          return window.__MAPGRAB__.getMapInterface(mapId)!;
        }

        return new Promise((resolve) => {
          const handler = () => {
            if (window.__MAPGRAB__ && window.__MAPGRAB__.getMapInterface(mapId)) {
              window.removeEventListener(MapGrabEvents.MAP_INTERFACE_INIT, handler);

              resolve(window.__MAPGRAB__.getMapInterface(mapId)!);
            }
          };

          window.addEventListener(MapGrabEvents.MAP_INTERFACE_INIT, handler);
          handler();
        });
      },
      { mapId: this.mapId }
    );

    return this.mapInterfaceHandle;
  }

  private async evaluateOnController<Args, T>(
    callback: (controller: MapControllerInterface, args: Args) => T,
    params?: { args?: Args; options?: { waitToStable?: boolean; timeout?: number } | undefined }
  ): Promise<T> {
    const controllerHandle = await this.getMapController();

    const result: T = await new Promise((resolve, reject) => {
      const timeout = params?.options?.timeout
        ? setTimeout(() => reject(new errors.TimeoutError()), params?.options?.timeout)
        : undefined;

      controllerHandle
        //@ts-ignore
        .evaluate(callback, params?.args)
        .then((data) => {
          clearTimeout(timeout);
          resolve(data);
        })
        .catch(reject);
    });

    if (params?.options?.waitToStable) {
      await this.waitToMapStable();
    }

    return result;
  }
}
