import type { FilterSpecification } from 'maplibre-gl';

export type LocatorPropMatch = {
  [key in string]: {
    comparator: '=' | '*';
    value: string[];
  };
};

export type LocatorProps = { map?: LocatorPropMatch; layer?: LocatorPropMatch; filter?: FilterSpecification };

export class MapGrabLocator {
  public readonly map: LocatorPropMatch | undefined;
  public readonly layer: LocatorPropMatch | undefined;
  public readonly filter: FilterSpecification | undefined;
  public readonly serialized: string;

  constructor(locator: string | LocatorProps) {
    const { map, layer, filter } = typeof locator === 'string' ? this.tokenize(locator) : locator;

    if (!map && !layer && !filter) {
      throw new Error('Invalid locator');
    }

    this.map = map;
    this.layer = layer;
    this.filter = filter;
    this.serialized = locator.toString();
  }

  private tokenize(input: string): LocatorProps {
    const regex = /\b(\w+)\[(\w+)(\*?)=(([a-zA-Z0-9_-]+)|\[([^\]]*)\])\]\s*/g;
    const tokens: LocatorProps = {};

    let match: RegExpExecArray | null;

    while ((match = regex.exec(input)) !== null) {
      const [, scope, property, comparator, value] = match;

      if (scope === 'map' || scope === 'layer') {
        const valueFormatted =
          value && value[0] === '['
            ? value
                .slice(1, value.length - 1)
                .split(',')
                .map((v) => v.trim())
            : [value];

        if (!tokens[scope]) {
          tokens[scope] = {};
        }

        if (scope in tokens) {
          tokens[scope]![property!] = { comparator: comparator || '=', value: valueFormatted } as LocatorPropMatch[0];
        }
      }
    }

    const filterMatch = input.match(/filter\[(.*?)(\]$|\]\s\w+)/);

    if (filterMatch) {
      tokens['filter'] = JSON.parse(`[${filterMatch[1]}]`);
    }

    return tokens;
  }
}
