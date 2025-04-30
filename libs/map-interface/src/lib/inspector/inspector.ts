// import { MapGrabEvents } from '@mapgrab-priv/map-interface';
import { InspectDialog } from './inspect-dialog';
import { MapGrabPublicInterfaceI, ResultFeatureInterface } from '@mapgrab/map-interface-types';
import { inspectorStyle } from './style';

declare global {
  interface Window {
    __MAPGRAB__: MapGrabPublicInterfaceI;
  }
}

export class Inspector {
  private readonly elementOverlayContainer: HTMLDivElement;
  private readonly style: HTMLStyleElement;

  private readonly mouseMoveHandler = this.onMouseMove.bind(this);
  private readonly mapMoveHandler = this.onMapMove.bind(this);
  private readonly mapClickHandler = this.onMapClick.bind(this);

  private inspectorDialog: InspectDialog;
  private currentFes?: ResultFeatureInterface;

  constructor() {
    this.inspectorDialog = new InspectDialog();
    this.elementOverlayContainer = document.createElement('div');
    this.style = document.createElement('style');
    this.style.textContent = inspectorStyle;
    this.createOverlayContainer();
  }

  public init() {
    document.body.appendChild(this.elementOverlayContainer);
    document.head.appendChild(this.style);

    window.addEventListener('__MAPGRAB__::MAP_INTERFACE_INIT', () => {
      this.bindMapInterfaces();
    });

    if (window.__MAPGRAB__) {
      this.bindMapInterfaces();
    }

    this.inspectorDialog.dialog.addEventListener('close', () => {
      this.bindMapInterfaces();
    });
  }

  public destroy() {
    this.unbindMapInterfaces();
    this.elementOverlayContainer.remove();
    this.inspectorDialog?.close();
    this.style.remove();
  }

  private bindMapInterfaces(): void {
    this.unbindMapInterfaces();

    const interfacesIds = window.__MAPGRAB__?.getMapInterfaceIds() || [];

    interfacesIds.forEach((mapId: string) => {
      //@ts-ignore
      window.__MAPGRAB__.getMapInterface(mapId)?.map.on('mousemove', this.mouseMoveHandler);
      //@ts-ignore
      window.__MAPGRAB__.getMapInterface(mapId)?.map.on('move', this.mapMoveHandler);
      //@ts-ignore
      window.__MAPGRAB__.getMapInterface(mapId)?.map?.on('mouseout', this.mouseMoveHandler);
      //@ts-ignore
      window.__MAPGRAB__.getMapInterface(mapId)?.map.on('click', this.mapClickHandler);
    });
  }

  private unbindMapInterfaces(): void {
    const interfacesIds = window.__MAPGRAB__?.getMapInterfaceIds() || [];

    interfacesIds.forEach((mapId: string) => {
      //@ts-ignore
      window.__MAPGRAB__.getMapInterface(mapId)?.map?.off('mousemove', this.mouseMoveHandler);
      //@ts-ignore
      window.__MAPGRAB__.getMapInterface(mapId)?.map?.off('move', this.mapMoveHandler);
      //@ts-ignore
      window.__MAPGRAB__.getMapInterface(mapId)?.map?.off('click', this.mapClickHandler);
      //@ts-ignore
      window.__MAPGRAB__.getMapInterface(mapId)?.map?.off('mouseout', this.mouseMoveHandler);
    });
  }

  private sst: any;

  private onMouseMove(e: any): void {
    clearInterval(this.sst);

    this.sst = setTimeout(() => {
      this._onMouseMove(e);
    }, 5);
  }

  private _onMouseMove(e: any): void {
    if (e.type === 'mouseout') {
      this.elementOverlayContainer.style.display = 'none';
      this.inspectorDialog.close();

      return;
    }

    const fes = window.__MAPGRAB__.inspectAtPoint('mainMap', e.point);
    const overlay = this.elementOverlayContainer;

    if (fes.length > 0) {
      overlay.style.display = 'block';

      const fesFocus =
        fes.find((d: any) => {
          return (
            d.rect.x <= e.originalEvent.clientX &&
            d.rect.y <= e.originalEvent.clientY &&
            d.rect.right >= e.originalEvent.clientX &&
            d.rect.bottom >= e.originalEvent.clientY
          );
        }) || fes[0];

      if (fesFocus) {
        this.currentFes = fesFocus;
      }

      const bbox = fesFocus?.rect;

      if (!bbox) {
        overlay.style.display = 'none';
        this.inspectorDialog.close();

        return;
      }

      this.inspectorDialog.show(e.originalEvent, fesFocus);

      overlay.style.width = bbox.width + 'px';
      overlay.style.height = bbox.height + 'px';
      overlay.style.top = bbox.y + 'px';
      overlay.style.left = bbox.x + 'px';
    } else {
      overlay.style.display = 'none';
      this.inspectorDialog.close();
    }
  }

  private onMapMove(): void {
    this.elementOverlayContainer.style.display = 'none';
  }

  private onMapClick(): void {
    if (this.currentFes) {
      this.unbindMapInterfaces();
      this.inspectorDialog.freeze();
    }
  }

  private createOverlayContainer() {
    this.elementOverlayContainer.style.position = 'fixed';
    this.elementOverlayContainer.style.backgroundColor = 'rgba(0, 43, 0, 0.3)';
    this.elementOverlayContainer.style.pointerEvents = 'none';
  }
}
