import { JSHandle, Locator, Mouse, Page, test } from '@playwright/test';

import { MapController } from './map-controller';
import { LocatorQueryResult, MergedResult, SingleLocatorQueryResult, SingleResult } from './models';
import {
  ExposeMutationResult,
  FitBoundsOptions,
  MapGrabEvents,
  MapGrabPublicInterfaceI,
  MapRect,
  MapRectInterface,
  ResultFeatureInterface,
} from '@mapgrab/map-interface-types';

export type GetResultOptions = { noEmptyResult?: boolean };

export type xOffset = number;
export type yOffset = number;

const getStackTrace = function () {
  const obj: any = {};
  Error.captureStackTrace(obj, getStackTrace);
  return obj.stack;
};

export class ElementNotExistsError extends Error {
  override message = 'Element not exists';
}

export class ToManyElementsError extends Error {
  override message = 'To many elements';
}

export type MergeFunction = (feature: ResultFeatureInterface) => string | number;

export class MapLocator {
  protected mapGrabInterface?: JSHandle<MapGrabPublicInterfaceI>;
  protected locatorBreadcrumbs: string[] = [];
  protected __CALLED_API_METHOD__?: string;
  protected evaluateElement: Locator;

  constructor(
    protected page: Page,
    public readonly selector: string,
    protected index?: number,
    protected _merge?: MergeFunction | boolean,
    locatorBreadcrumbs?: string[],
    evaluateElement?: Locator
  ) {
    if (locatorBreadcrumbs) {
      this.locatorBreadcrumbs = locatorBreadcrumbs;
    }

    this.evaluateElement = evaluateElement ?? this.page.locator('html');

    Error.captureStackTrace(this, this.constructor);
  }

  public first(): MapLocator {
    return this._nth(0, 'first()');
  }

  public last(): MapLocator {
    return this._nth(-1, 'last()');
  }

  public nth(index: number): MapLocator {
    return this._nth(index, `nth(${index})`);
  }

  public onIframe(iframeLocator: string): MapLocator {
    return new MapLocator(
      this.page,
      this.selector,
      this.index,
      this._merge,
      this.locatorBreadcrumbs,
      this.page.frameLocator(iframeLocator).locator('html')
    );
  }

  private _nth(index: number, breadCrumb: string): MapLocator {
    return new MapLocator(
      this.page,
      this.selector,
      index,
      this._merge,
      [...this.locatorBreadcrumbs, breadCrumb],
      this.evaluateElement
    );
  }

  public merge(mergeFunction?: MergeFunction | string): MapLocator {
    const resolvedMergeFunction =
      typeof mergeFunction === 'string'
        ? (feature: ResultFeatureInterface) => feature.properties && feature.properties[mergeFunction]
        : mergeFunction;

    return new MapLocator(
      this.page,
      this.selector,
      this.index,
      resolvedMergeFunction || true,
      [
        ...this.locatorBreadcrumbs,
        `merge(${!mergeFunction ? '' : typeof mergeFunction === 'string' ? "'" + mergeFunction + "'" : 'fn'})`,
      ],
      this.evaluateElement
    );
  }

  public async fitMap(options?: FitBoundsOptions): Promise<void> {
    this.__CALLED_API_METHOD__ = 'fitMap';

    const element = await this.getElement();

    if (element) {
      const mapId: string = 'features' in element ? element.features[0]!.mapId : element.mapId;

      await new MapController(this.page, mapId).fitMapToBoundingBox(element.rect, options);
    }
  }

  public async click(options?: Parameters<Mouse['click']>[2]): Promise<void> {
    this.__CALLED_API_METHOD__ = 'click';
    const position = await this.getInteractionPosition();

    if (position) {
      const { x, y } = position;
      await this.evaluateElement.click({ position: { x, y }, ...options });
    }
  }

  public async dblclick(options?: Parameters<Mouse['dblclick']>[2]): Promise<void> {
    this.__CALLED_API_METHOD__ = 'dblclick';
    const position = await this.getInteractionPosition();

    if (position) {
      const { x, y } = position;
      await this.evaluateElement.dblclick({ position: { x, y }, ...options });
    }
  }

  public async boundingBox(options?: {
    padding?: number | [number] | [number, number] | [number, number, number, number] | undefined;
    offset?: number | [xOffset, yOffset] | undefined;
    relativeTo?: 'parentWindow' | 'rootWindow';
  }): Promise<MapRectInterface> {
    this.__CALLED_API_METHOD__ = 'boundingBox';

    const { rect } = await this.getElement();
    let applyXy: { x: number; y: number } = { x: 0, y: 0 };

    if (options?.relativeTo === 'rootWindow') {
      const bbox = await this.evaluateElement.boundingBox();

      if (bbox != null) {
        applyXy = bbox;
      }
    }

    let rectO = new MapRect(rect.x + applyXy.x, rect.y + applyXy.y, rect.right + applyXy.x, rect.bottom + applyXy.y);

    if (options?.padding) {
      rectO = rectO.applyPadding(options.padding);
    }

    if (options?.offset) {
      rectO = rectO.applyOffset(options.offset);
    }

    return rectO;
  }

  public async count(): Promise<number> {
    this.__CALLED_API_METHOD__ = 'count';

    return (await this.getResult()).length;
  }

  public async forEach(callback: (locator: MapLocator, index: number) => any): Promise<void> {
    this.__CALLED_API_METHOD__ = 'count';

    for (let i = 0; i < (await this.count()); i++) {
      await callback(this.nth(i), i);
    }
  }

  async screnshoot(opts?: {
    padding?: number | [number, number] | [number | number | number | number];
    offset?: number | [xOffset, yOffset];
    expose?:
      | { backgroundColor?: string; additionalVisibleLayers?: string[]; hiddenLayers?: 'allOther' | string[] }
      | boolean;
  }): Promise<Buffer> {
    this.__CALLED_API_METHOD__ = 'screenshot';

    const element = await this.getElement();

    let mutationsState: { controller: MapController; state: ExposeMutationResult }[] = [];

    if (opts?.expose) {
      const additionalLayers = typeof opts?.expose === 'object' ? opts?.expose?.additionalVisibleLayers || [] : [],
        elementLayers = 'features' in element ? element.features.map((f) => f.layerId) : [element.layerId],
        mapIds = 'features' in element ? element.features.map((f) => f.mapId) : [element.mapId],
        layersToExpose = [...new Set([...elementLayers, ...additionalLayers])],
        layersToHide = typeof opts?.expose === 'object' ? opts?.expose?.hiddenLayers || 'allOther' : 'allOther',
        backgroundColor =
          typeof opts?.expose === 'object' && opts.expose.backgroundColor ? opts.expose.backgroundColor : undefined;

      mutationsState = await Promise.all(
        [...new Set(mapIds)].map(async (mapId) => {
          const controller = new MapController(this.page, mapId).onIframe(this.evaluateElement),
            state = await controller.exposeLayers(layersToExpose, layersToHide);

          if (backgroundColor) {
            await controller.setBackgroundColor(backgroundColor);
          }

          return { controller, state };
        })
      );
    }

    await this.waitToMapStable();

    const bbox = await this.boundingBox({ padding: opts?.padding, offset: opts?.offset, relativeTo: 'rootWindow' }),
      screenshot = await this.page.screenshot({ clip: bbox, fullPage: true });

    if (mutationsState.length > 0) {
      if (typeof opts?.expose === 'object' && opts.expose.backgroundColor) {
        await Promise.all(mutationsState.map(({ controller }) => controller.removeBackground()));
      }

      await Promise.all(mutationsState.map(({ controller, state }) => controller.revertExposeLayers(state)));
    }

    return screenshot;
  }

  public async getElement(): Promise<SingleResult | MergedResult> {
    const stack = getStackTrace();

    try {
      const getElements = async (): Promise<LocatorQueryResult> => {
        const elements: Array<SingleResult | MergedResult> = await this.getResult();

        if (elements.length > 0) {
          return elements;
        }

        return await getElements();
      };

      const elements = await getElements();

      if (elements.length > 1 && this.index == null) {
        throw new ToManyElementsError();
      }

      if (elements[0]) {
        return elements[0];
      }

      throw new ElementNotExistsError();
    } catch (e) {
      if (test.info().status === 'timedOut') {
        const method = this.__CALLED_API_METHOD__;

        const r = new Error(
          `mapLocator.${method}: Test timeout of ${
            test.info().timeout
          }ms exceeded.\nCall log:\n - waiting for locator('${this.selector}').${this.locatorBreadcrumbs.join('.')}`
        );

        r.stack = stack
          .split('\n')
          .filter((r: string) => r.includes('at') && !r.includes('MapLocator.'))
          .join('\n');

        throw r;
      }

      throw e;
    }
  }

  public async getResult(): Promise<LocatorQueryResult> {
    await this.waitToMapStable();

    const mapGrab = await this.getMapGrabInterface();

    const result: ResultFeatureInterface[] = await mapGrab.evaluate(
      (mapGrab, { locator }) => {
        return mapGrab.query(locator);
      },
      { locator: this.selector }
    );

    return this.transformResult(result);
  }

  private transformResult(result: ResultFeatureInterface[]): LocatorQueryResult {
    let newResult: LocatorQueryResult = result;

    newResult = result.filter((e) => e.isVisible);

    if (this._merge) {
      newResult = this.mergeData(newResult as ResultFeatureInterface[]);
    }

    if (newResult.length > 1 && this.index != null) {
      const element = newResult.at(this.index);

      if (element != null) {
        return [element];
      }
    }

    return newResult;
  }

  private async getInteractionPosition(): Promise<{ x: number; y: number } | undefined> {
    const element = await this.getElement();

    const point = element.interactionPoints[0];

    if (!point) {
      throw new Error('Element visible but it to small to interact with it');
    }

    return point;
  }

  private async waitToMapStable(): Promise<void> {
    const mapGrabHandle = await this.getMapGrabInterface();

    await mapGrabHandle.evaluate(
      (mapInterface, locator) => mapInterface.waitMapStableForLocator(locator),
      this.selector
    );
  }

  private async getMapGrabInterface(): Promise<JSHandle<MapGrabPublicInterfaceI>> {
    if (this.mapGrabInterface) {
      return this.mapGrabInterface;
    }

    this.mapGrabInterface = await this.evaluateElement.evaluateHandle(
      (_, { events }) => {
        if (window.__MAPGRAB__) {
          return window.__MAPGRAB__;
        }

        return new Promise((resolve) => {
          const handler = () => {
            if (window.__MAPGRAB__) {
              window.removeEventListener(events.MAP_GRAB_INTERFACE_INIT, handler);
              resolve(window.__MAPGRAB__);
            }
          };

          window.addEventListener(events.MAP_GRAB_INTERFACE_INIT, handler);
          handler();
        });
      },
      { events: MapGrabEvents }
    );

    return this.mapGrabInterface;
  }

  private mergeData(data: ResultFeatureInterface[]): LocatorQueryResult {
    if (!data[0]) {
      return [];
    }

    if (typeof this._merge === 'function') {
      const mergeFunction = this._merge;

      const groupedFeatures: Record<string | number, SingleLocatorQueryResult> = data.reduce((acc, feature) => {
        const key: string | number = mergeFunction(feature);

        if (acc[key]) {
          acc[key] = mergeFeature(acc[key]!, feature);
        } else {
          acc[key] = feature;
        }

        return acc;
      }, {} as Record<string | number, MergedResult | SingleResult>);

      return Object.values(groupedFeatures);
    }

    const merged = data.reduce((acc, feature, index) => {
      if (index === 0) {
        return acc;
      }

      return mergeFeature(acc, feature);
    }, data[0] as MergedResult | SingleResult);

    return [merged];
  }
}

export function mapLocator(page: Page, locator: string): MapLocator {
  return new MapLocator(page, locator);
}

export function mergeFeature(
  featureA: SingleResult | MergedResult,
  featureB: SingleResult | MergedResult
): SingleResult | MergedResult {
  if (featureA === featureB) return featureA;

  const mapRect = new MapRect(featureA.rect.x, featureA.rect.y, featureA.rect.right, featureA.rect.bottom).merge(
    featureB.rect
  );

  return {
    interactionPoints: [...featureA.interactionPoints, ...featureB.interactionPoints],
    rect: mapRect,
    features: [
      ...('features' in featureA ? featureA.features : [featureA]),
      ...('features' in featureB ? featureB.features : [featureB]),
    ],
  };
}
