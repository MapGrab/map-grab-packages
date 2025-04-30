import { ResultFeatureInterface } from '@mapgrab/map-interface-types';

export class InspectDialog {
  public readonly dialog: HTMLDialogElement = document.createElement('dialog');

  private readonly container = document.createElement('div');

  constructor() {
    this.container.appendChild(this.dialog);
    this.container.classList.add('VV_inspector_container');
  }

  public show(mouseEvent: MouseEvent, feature: ResultFeatureInterface) {
    this.dialog.style.position = 'fixed';

    this.dialog.style.top = mouseEvent.clientY + 10 + 'px';
    this.dialog.style.left = mouseEvent.clientX + 10 + 'px';

    const dialogbbox = this.dialog.getBoundingClientRect();

    if (dialogbbox.bottom > window.innerHeight) {
      this.dialog.style.bottom = dialogbbox.y + 'px';
      this.dialog.style.top = dialogbbox.y - dialogbbox.height + 'px';
    }

    const closeButton_svg =
      '<svg xmlns="http://www.w3.org/2000/svg" class="close-button" width="32" height="32" fill="#000000" viewBox="0 0 256 256"><path d="M165.66,101.66,139.31,128l26.35,26.34a8,8,0,0,1-11.32,11.32L128,139.31l-26.34,26.35a8,8,0,0,1-11.32-11.32L116.69,128,90.34,101.66a8,8,0,0,1,11.32-11.32L128,116.69l26.34-26.35a8,8,0,0,1,11.32,11.32ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"></path></svg>';
    const closeButton = new DOMParser().parseFromString(closeButton_svg, 'text/html').body.childNodes[0] as HTMLElement;
    closeButton.onclick = () => this.dialog.close();

    function propHtml(
      propName: string,
      label: string,
      propLabel: string,
      propValue: string,
      checked = false,
      disabled = false
    ): string {
      return `<li><div><input type="checkbox" 
        ${checked ? 'checked' : ''}
        ${disabled ? 'disabled' : ''}
        name="${propName}" value="${propValue}" id="VVP_${propName}" />  <label for="VVP_${propName}"><span class="pre">${label}:</span> <span class="val">${propLabel}</span></label></div></li>`;
    }

    const propsString = Object.keys(feature.properties).map((propName) => {
      const checked = propName.includes('id');

      return propHtml(`property[${propName}]`, propName, feature.properties[propName], propName, checked);
    });

    const form = document.createElement('form');
    form.innerHTML = `
        <ul style="list-style: none;">
          ${propHtml('mapId', 'mapId', feature.mapId, feature.mapId, true)}
          ${propHtml('layerId', 'layerId', feature.layerId, feature.layerId, true)}
          <li>Feature properties: </li>
          <ul>${propsString.join('')}</ul>
        </ul>`;

    this.dialog.innerHTML = ``;

    this.dialog.appendChild(closeButton);
    this.dialog.appendChild(form);

    const locatorC = document.createElement('div');
    locatorC.classList.add('selector-text');

    const xx = () => {
      //@ts-ignore
      const val = Object.fromEntries(new FormData(form));

      const locator = createLocator(val, feature);

      const icon = `<svg style="cursor: pointer" xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#000000" viewBox="0 0 256 256"><path d="M216,32H88a8,8,0,0,0-8,8V80H40a8,8,0,0,0-8,8V216a8,8,0,0,0,8,8H168a8,8,0,0,0,8-8V176h40a8,8,0,0,0,8-8V40A8,8,0,0,0,216,32ZM160,208H48V96H160Zm48-48H176V88a8,8,0,0,0-8-8H96V48H208Z"></path></svg>`;
      const copyIcon = new DOMParser().parseFromString(icon, 'text/html').body.childNodes[0] as HTMLElement;
      copyIcon.onclick = () => window.navigator.clipboard.writeText(locator);

      locatorC.innerHTML = `<p>${locator}</p>`;
      locatorC.appendChild(copyIcon);

      if (Object.keys(val).length > 0) {
        this.dialog.appendChild(locatorC);
      } else {
        locatorC.remove();
      }
    };

    form.addEventListener('input', xx);

    xx();

    document.body.appendChild(this.container);
    this.dialog.show();
  }

  public close() {
    this.container.remove();
  }

  public freeze(): void {
    this.dialog.close();
    this.dialog.showModal();
    this.dialog.classList.add('freeze');
  }
}

function createLocator(obj: any, feature: ResultFeatureInterface): string {
  const locator: string[] = [];

  if (obj['mapId']) {
    locator.push(`map[id=${obj['mapId']}]`);
  }

  if (obj['layerId']) {
    locator.push(`layer[id=${obj['layerId']}]`);
  }

  const filters = Object.keys(obj).reduce((acc, key) => {
    if (key.includes('property')) {
      const propKey = obj[key];
      const value = feature.properties[propKey];
      let strictValue = value;

      if (typeof value === 'string') {
        strictValue = `"${value}"`;
      }

      acc.push(`["==", ["get", "${propKey}"], ${strictValue}]`);
    }

    return acc;
  }, [] as string[]);

  if (filters.length > 0) {
    locator.push(`filter["all", ${filters.join(', ')}]`);
  }

  return locator.join(' ');
}
