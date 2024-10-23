import { faker } from '@faker-js/faker';
import { MapController } from '@mapgrab/playwright';
import { Page } from '@playwright/test';
import {
  bboxPolygon,
  FeatureCollection,
  featureCollection,
  lineString,
  point,
  randomLineString,
  randomPolygon,
} from '@turf/turf';
import { LayerSpecification, SourceSpecification } from 'maplibre-gl';

import { addMapReSource } from './map';

export type CircleProps = { opacity: number; id: number; color: string };
export type SymbolProps = {
  textOpacity: number;
  id: number;
  text: string;
  icon: string;
  'icon-translate': [number, number];
  'icon-offset': [number, number];
  'text-translate': [number, number];
  'text-offset': [number, number];
  'icon-rotate': number;
};

export class CircleSeed {
  private sourceId: string;
  private sourceData: FeatureCollection<any> = featureCollection([]);
  private readonly controller: MapController;
  private attached = false;

  constructor(private readonly page: Page, private readonly mapId: string, private readonly layerId: string) {
    this.sourceId = this.layerId;
    this.controller = new MapController(this.page, this.mapId);
  }

  public async addCircle(properties?: Partial<CircleProps>, pos?: [number, number]) {
    const circlePoint = this.generateCircle(properties, pos);

    this.sourceData.features.push(circlePoint);
    await this.updateSource();
  }

  public async generateCircles(count: number) {
    const circlesPoint = Array.from(Array(count)).map(() => this.generateCircle());

    this.sourceData.features.push(...circlesPoint);
    await this.updateSource();
  }

  private generateCircle(properties?: Partial<CircleProps>, pos?: [number, number]) {
    return point(
      pos ?? [faker.location.longitude({ min: -160, max: 160 }), faker.location.latitude({ max: 60, min: -60 })],
      {
        goblinName: faker.person.fullName(),
        id: properties?.id ?? faker.number.int({ min: 10, max: 10000 }),
        opacity: properties?.opacity ?? 1,
        color: properties?.color ?? faker.color.rgb(),
      }
    );
  }

  public async attach(): Promise<void> {
    const source: { id: string; spec: SourceSpecification } = {
      id: this.sourceId,
      spec: {
        type: 'geojson',
        data: this.sourceData,
      },
    };
    const layer: LayerSpecification = {
      id: this.layerId,
      type: 'circle',
      source: source.id,
      paint: { 'circle-radius': 5, 'circle-opacity': ['get', 'opacity'], 'circle-color': ['get', 'color'] },
    };

    await addMapReSource(this.page, this.mapId, { source, layer }, true, 0);
    this.attached = true;
  }

  private async updateSource(): Promise<void> {
    if (!this.attached) {
      return;
    }

    const map = await this.controller.getMapInstance();

    await map.evaluate((map, { sourceId, data }) => map.getSource(sourceId).setData(data), {
      sourceId: this.sourceId,
      data: this.sourceData,
    });
  }
}

export class FillSeed {
  private sourceId: string;
  private sourceData: FeatureCollection<any> = featureCollection([]);
  private readonly controller: MapController;
  private attached = false;

  constructor(private readonly page: Page, private readonly mapId: string, private readonly layerId: string) {
    this.sourceId = this.layerId;
    this.controller = new MapController(this.page, this.mapId);
  }

  public async addFill(properties?: Partial<CircleProps>) {
    const polygon = this.generateFill(properties);

    this.sourceData.features.push(polygon);
    await this.updateSource();
  }

  public async addCrossTileBoundaryFill(properties?: Partial<CircleProps>) {
    const polygon = this.generateFill(properties);
    const geo = bboxPolygon([-160, 0, 160, 20]);

    polygon.geometry = geo.geometry;

    this.sourceData.features.push(polygon);
    await this.updateSource();
  }

  public async generateFills(count: number) {
    const polygons = Array.from(Array(count)).map(() => this.generateFill());

    this.sourceData.features.push(...polygons);
    await this.updateSource();
  }

  private generateFill(properties?: Partial<CircleProps>) {
    return {
      ...randomPolygon(1, { bbox: [-160, -80, 160, 80], max_radial_length: 10, num_vertices: 5 }).features[0],
      properties: {
        goblinName: faker.person.fullName(),
        id: properties?.id ?? faker.number.int({ min: 10, max: 10000 }),
        opacity: properties?.opacity ?? 1,
        color: properties?.color ?? faker.color.rgb(),
      },
    };
  }

  public async attach(): Promise<void> {
    const source: { id: string; spec: SourceSpecification } = {
      id: this.sourceId,
      spec: {
        promoteId: 'id',
        type: 'geojson',
        data: this.sourceData,
        tolerance: 0.0001,
      },
    };
    const layer: LayerSpecification = {
      id: this.layerId,
      type: 'fill',
      source: source.id,
      paint: { 'fill-opacity': ['get', 'opacity'], 'fill-color': ['get', 'color'] },
    };

    await addMapReSource(this.page, this.mapId, { source, layer }, true, 0);
    this.attached = true;
  }

  private async updateSource(): Promise<void> {
    if (!this.attached) {
      return;
    }

    const map = await this.controller.getMapInstance();

    await map.evaluate((map, { sourceId, data }) => map.getSource(sourceId).setData(data), {
      sourceId: this.sourceId,
      data: this.sourceData,
    });
  }
}

export class LineSeed {
  private sourceId: string;
  private sourceData: FeatureCollection<any> = featureCollection([]);
  private readonly controller: MapController;
  private attached = false;
  private source: { id: string; spec: SourceSpecification };
  private layer: LayerSpecification;

  constructor(private readonly page: Page, private readonly mapId: string, private readonly layerId: string) {
    this.sourceId = this.layerId;
    this.controller = new MapController(this.page, this.mapId);

    this.source = {
      id: this.sourceId,
      spec: {
        promoteId: 'id',
        type: 'geojson',
        data: this.sourceData,
      },
    };
    this.layer = {
      id: this.layerId,
      type: 'line',
      source: this.source.id,
      paint: { 'line-opacity': ['get', 'opacity'], 'line-color': ['get', 'color'], 'line-width': 2 },
    };
  }

  public async addLine(properties?: Partial<CircleProps>) {
    const line = this.generateLine(properties);

    this.sourceData.features.push(line);
    await this.updateSource();
  }

  public async addCrossTileBoundaryLine(properties?: Partial<CircleProps>) {
    const line = this.generateLine(properties);
    const geo = lineString([
      [-120, 20],
      [120, 20],
    ]);

    line.geometry = geo.geometry;

    this.sourceData.features.push(line);
    await this.updateSource();
  }

  public async generateLines(count: number) {
    const lines = Array.from(Array(count)).map(() => this.generateLine());

    this.sourceData.features.push(...lines);
    await this.updateSource();
  }

  public setLayerSpec(spec: Partial<LayerSpecification>): void {
    //@ts-ignore
    this.layer = { ...this.layer, ...spec };
  }

  private generateLine(properties?: Partial<CircleProps>) {
    return {
      ...randomLineString(1, { bbox: [-120, -70, 120, 70], max_length: 100 }).features[0],
      properties: {
        goblinName: faker.person.fullName(),
        id: properties?.id ?? faker.number.int({ min: 10, max: 10000 }),
        opacity: properties?.opacity ?? 1,
        color: properties?.color ?? faker.color.rgb(),
      },
    };
  }

  public async attach(): Promise<void> {
    await addMapReSource(this.page, this.mapId, { source: this.source, layer: this.layer }, true, 0);
    this.attached = true;
  }

  private async updateSource(): Promise<void> {
    if (!this.attached) {
      return;
    }

    const map = await this.controller.getMapInstance();

    await map.evaluate((map, { sourceId, data }) => map.getSource(sourceId).setData(data), {
      sourceId: this.sourceId,
      data: this.sourceData,
    });
  }
}

export class SymbolSeed {
  private sourceId: string;
  private sourceData: FeatureCollection<any> = featureCollection([]);
  private readonly controller: MapController;
  private attached = false;
  private source: { id: string; spec: SourceSpecification };
  private layer: LayerSpecification;

  constructor(
    private readonly page: Page,
    private readonly mapId: string,
    private readonly layerId: string,
    private readonly isMapbox: boolean
  ) {
    this.sourceId = this.layerId;
    this.controller = new MapController(this.page, this.mapId);

    this.source = {
      id: this.sourceId,
      spec: {
        promoteId: 'id',
        type: 'geojson',
        data: this.sourceData,
      },
    };
    this.layer = {
      id: this.layerId,
      type: 'symbol',
      source: this.source.id,
      layout: {
        'text-field': ['get', 'text'],
        'icon-image': ['get', 'icon'],
        'text-anchor': 'top',
        'text-offset': ['coalesce', ['get', 'text-offset'], ['literal', [0, 0]]],
        'icon-offset': ['coalesce', ['get', 'icon-offset'], ['literal', [0, 0]]],
        'icon-rotate': ['coalesce', ['get', 'icon-rotate'], 0],
      },
      paint: { 'text-opacity': ['get', 'text-opacity'] },
    };
  }

  public setLayerSpec(spec: Partial<LayerSpecification>): void {
    //@ts-ignore
    this.layer = {
      ...this.layer,
      ...spec,
      paint: { ...this.layer.paint, ...spec.paint },
      layout: { ...this.layer.layout, ...spec.layout },
    };
  }

  public async addSymbol(properties?: Partial<SymbolProps>, pos?: [number, number]) {
    const circlePoint = this.generateSymbol(properties, pos);

    this.sourceData.features.push(circlePoint);
    await this.updateSource();
  }

  public async generateSymbols(count: number) {
    const circlesPoint = Array.from(Array(count)).map(() => this.generateSymbol());

    this.sourceData.features.push(...circlesPoint);
    await this.updateSource();
  }

  private generateSymbol(properties?: Partial<SymbolProps>, pos?: [number, number]) {
    return point(
      pos ?? [faker.location.longitude({ min: -160, max: 160 }), faker.location.latitude({ max: 60, min: -60 })],
      {
        goblinName: faker.person.fullName(),
        id: properties?.id ?? faker.number.int({ min: 10, max: 10000 }),
        textOpacity: properties?.textOpacity ?? 1,
        text: properties?.text ?? faker.lorem.words(6),
        icon: properties?.icon ?? ['cat'][faker.number.int({ min: 0, max: 0 })],
        'icon-translate': properties?.['icon-translate'] ?? [
          faker.number.int({ min: 0, max: 20 }),
          faker.number.int({ min: 0, max: 20 }),
        ],
      }
    );
  }

  public async attach(): Promise<void> {
    await addMapReSource(
      this.page,
      this.mapId,
      {
        image: { id: 'cat', url: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Icon_ionic-md-close-1%402x.png' },
      },
      this.isMapbox,
      0
    );
    await addMapReSource(this.page, this.mapId, { source: this.source, layer: this.layer }, this.isMapbox, 0);
    this.attached = true;
  }

  private async updateSource(): Promise<void> {
    if (!this.attached) {
      return;
    }

    const map = await this.controller.getMapInstance();

    await map.evaluate((map, { sourceId, data }) => map.getSource(sourceId).setData(data), {
      sourceId: this.sourceId,
      data: this.sourceData,
    });
  }
}
