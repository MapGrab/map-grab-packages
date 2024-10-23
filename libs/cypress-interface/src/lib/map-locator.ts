import {
  type MapGrabPublicInterfaceI,
  MapRect,
  type MapRectInterface,
  type ResultFeatureInterface,
  type ExposeMutationResult,
  type FitBoundsOptions,
} from '@mapgrab/map-interface-types';

import { MapController } from './map-controller';
import type { LocatorQueryResult, MergedResult, SingleLocatorQueryResult, SingleResult } from './models';

const getStackTrace = function () {
  const obj: any = {};
  Error.captureStackTrace(obj, getStackTrace);
  return obj.stack;
};

export class ElementNotExistsError extends Error {
  constructor(private readonly selector: string) {
    super();

    this.message = `Element ${this.selector} not exists`;
  }
}

export type MergeFunction = (feature: ResultFeatureInterface) => string | number;

export class ToManyElementsError extends Error {
  override message = 'To many elements';
}

export class MapLocator {
  private exposeMutationResults?: { controller: MapController; state: ExposeMutationResult }[];

  constructor(
    protected readonly cy: Cypress.cy,
    protected readonly _window: Window,
    public readonly selector: string,
    protected readonly _dispatchContext?: JQuery<HTMLElement>,
    protected index?: number,
    protected _merge?: MergeFunction | boolean
  ) {}

  private get dispatchContext() {
    return this._dispatchContext ? this.cy.wrap(this._dispatchContext) : this.cy.get('html');
  }

  // Chain inspect format
  public inspect(): string {
    return 'mapLocator(' + this.selector.slice(0, 26) + '})';
  }

  // Chain length matcher support
  public get length() {
    return this.countSync();
  }

  public first(): MapLocator {
    return this.nth(0);
  }

  public last(): MapLocator {
    return this.nth(-1);
  }

  public nth(index: number): MapLocator {
    return new MapLocator(this.cy, this._window, this.selector, this._dispatchContext, index, this._merge);
  }

  public merge(mergeFunction?: MergeFunction | string): MapLocator {
    const resolvedMergeFunction =
      typeof mergeFunction === 'string'
        ? (feature: ResultFeatureInterface) => feature.properties && feature.properties[mergeFunction]
        : mergeFunction;

    return new MapLocator(
      this.cy,
      this._window,
      this.selector,
      this._dispatchContext,
      this.index,
      resolvedMergeFunction || true
    );
  }

  public click(options?: Partial<Cypress.ClickOptions>): Cypress.Chainable<any> {
    return this.getPosition().then((position) => {
      if (position) {
        const { x, y } = position;
        return this.dispatchContext.click(x, y, options);
      }

      return;
    });
  }

  public rightclick(options?: Partial<Cypress.ClickOptions>): Cypress.Chainable<any> {
    return this.getPosition().then((position) => {
      if (position) {
        const { x, y } = position;
        return this.dispatchContext.rightclick(x, y, options);
      }

      return;
    });
  }

  public dblclick(options?: Partial<Cypress.ClickOptions>): Cypress.Chainable<any> {
    return this.getPosition().then((position) => {
      if (position) {
        const { x, y } = position;
        return this.dispatchContext.dblclick(x, y, options);
      }

      return;
    });
  }

  public fitMap(options?: FitBoundsOptions): Cypress.Chainable<undefined> {
    return this.getElement().then((element) => {
      if (element) {
        const mapId: string =
          'features' in element && element.features[0]
            ? element.features[0].mapId
            : 'mapId' in element
            ? element.mapId
            : '';

        new MapController(this.cy, this._window, mapId).fitMapToBoundingBox(element.rect, options);
      }

      return this.cy.wrap(undefined);
    });
  }

  public createScreenshotExposition(opts: {
    backgroundColor?: string;
    additionalVisibleLayers?: string[];
    hiddenLayers?: 'allOther' | string[];
  }): Cypress.Chainable<any> {
    return this.getElement().then((element) => {
      let mutationPromises: Promise<any>[] = [];

      const additionalLayers = opts.additionalVisibleLayers ?? [],
        elementLayers = 'features' in element ? element.features.map((f) => f.layerId) : [element.layerId],
        mapIds = 'features' in element ? element.features.map((f) => f.mapId) : [element.mapId],
        layersToExpose = [...new Set([...elementLayers, ...additionalLayers])],
        layersToHide = opts?.hiddenLayers ?? 'allOther',
        backgroundColor = opts.backgroundColor ?? undefined;

      mutationPromises = [...new Set(mapIds)].map(async (mapId) => {
        const controller = new MapController(this.cy, this._window, mapId),
          state = await new Promise((r) => controller.exposeLayers(layersToExpose, layersToHide).then((x) => r(x)));

        if (backgroundColor) {
          await new Promise((r) => controller.setBackgroundColor(backgroundColor).then(r));
        }

        return { controller, state };
      });

      return this.cy
        .wrap(Promise.all(mutationPromises), { log: false })
        .spread((...mutationsState: { controller: MapController; state: ExposeMutationResult }[]) => {
          this.exposeMutationResults = mutationsState;

          return;
        });
    });
  }

  public revertScreenshotExposition(): Cypress.Chainable<void> {
    const rollback = async () => {
      if (this.exposeMutationResults && this.exposeMutationResults.length > 0) {
        await Promise.all(this.exposeMutationResults.map(({ controller }) => controller.removeBackground()));

        await Promise.all(
          this.exposeMutationResults.map(({ controller, state }) => controller.revertExposeLayers(state))
        );
      }
    };

    return this.cy.wrap(rollback(), { log: false });
  }

  public boundingBox(options?: {
    padding?: number | [number] | [number, number] | [number, number, number, number] | undefined;
    offset?: number | [number, number] | undefined;
    relativeTo?: 'parentWindow' | 'rootWindow';
  }): Cypress.Chainable<MapRectInterface> {
    return this.getElement().then((element) => {
      const rect = this.transformBoundingBox(element.rect, options);

      return this.cy.wrap(rect, { log: false });
    });
  }

  public boundingBoxSync(options?: {
    padding?: number | [number] | [number, number] | [number, number, number, number] | undefined;
    offset?: number | [number, number] | undefined;
    relativeTo?: 'parentWindow' | 'rootWindow';
  }): MapRectInterface {
    try {
      const { rect } = this.getResultSync()[0]!;

      return this.transformBoundingBox(rect, options);
    } catch (_e) {
      return new MapRect(0, 0, 0, 0);
    }
  }

  protected transformBoundingBox(
    rect: MapRectInterface,
    options?: {
      padding?: number | [number] | [number, number] | [number, number, number, number] | undefined;
      offset?: number | [number, number] | undefined;
      relativeTo?: 'parentWindow' | 'rootWindow';
    }
  ): MapRectInterface {
    let applyXy: { x: number; y: number } = { x: 0, y: 0 };

    const _interface = this.getMapGrabInterfaceSync();

    if (options?.relativeTo === 'rootWindow' && _interface) {
      applyXy = _interface.utils.frameAbsolutePosition(this._window);
    }

    rect = new MapRect(rect.x + applyXy.x, rect.y + applyXy.y, rect.right + applyXy.x, rect.bottom + applyXy.y);

    if (options?.padding) {
      rect = new MapRect(rect.x, rect.y, rect.right, rect.bottom).applyPadding(options.padding);
    }

    if (options?.offset) {
      rect = new MapRect(rect.x, rect.y, rect.right, rect.bottom).applyOffset(options.offset);
    }

    return rect;
  }

  public count(): Cypress.Chainable<number> {
    return this.getResult().then((elements) => elements.length);
  }

  public countSync(): number {
    try {
      return this.getResultSync().length;
    } catch (e) {
      return 0;
    }
  }

  public getResult(): Cypress.Chainable<LocatorQueryResult> {
    return this.waitToMapStable().then(() => {
      return this.getMapGrabInterface()
        .then((mapGrab) => mapGrab.query(this.selector))
        .then((result) => this.transformResult(result));
    });
  }

  public getResultSync(): LocatorQueryResult {
    const mapGrab = this.getMapGrabInterfaceSync();

    if (!mapGrab) {
      throw new Error('MapGrab interface not found');
    }

    const result = mapGrab.query(this.selector);

    return this.transformResult(result);
  }

  public waitToMapStable() {
    return this.getMapGrabInterface().then((mapGrab) => {
      return mapGrab.waitMapStableForLocator(this.selector);
    });
  }

  public getMapGrabInterface(): Cypress.Chainable<MapGrabPublicInterfaceI> {
    return this.cy.wrap(this._window, { log: false }).its('__MAPGRAB__', { log: false });
  }

  public getMapGrabInterfaceSync(): MapGrabPublicInterfaceI | undefined {
    return this._window?.__MAPGRAB__;
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

  private getPosition() {
    return this.getElement().then((element) => {
      const { x, y } = element.interactionPoints[0] ?? { x: 0, y: 0 };

      return this.cy.wrap({ x, y }, { log: false });
    });
  }

  private getElement(): Cypress.Chainable<SingleLocatorQueryResult> {
    const stack = getStackTrace();

    const cyx = new Cypress.Promise((resolve, reject) => {
      setTimeout(() => {
        const e = new ElementNotExistsError(this.selector);
        e.stack = stack.split('\n').at(-1);

        reject(e);
      }, Cypress.config('defaultCommandTimeout'));

      const getElement = () => {
        this.getResult().then((elements) => {
          if (elements.length > 1) {
            reject(new ToManyElementsError());
            return;
          }

          if (elements[0]) {
            resolve(elements[0]);

            return;
          }

          this.cy.wait(200, { log: false }).then(() => getElement());
        });
      };

      getElement();
    });

    return this.cy.wrap(cyx, { log: false });
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
