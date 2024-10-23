import { MapGrabLocator } from './map-locator';

describe('MapGrabLocator', () => {
  test.each([
    {
      locator: new MapGrabLocator('map[id=123]'),
      expectedMapValue: ['123'],
      expectedMapComparator: '=',
      expectedMapProperty: 'id',
    },
    {
      locator: new MapGrabLocator('map[id=[123,1234]]'),
      expectedMapValue: ['123', '1234'],
      expectedMapComparator: '=',
      expectedMapProperty: 'id',
    },
    {
      locator: new MapGrabLocator('map[id*=123]'),
      expectedMapValue: ['123'],
      expectedMapComparator: '*',
      expectedMapProperty: 'id',
    },
    // Map with layer
    {
      locator: new MapGrabLocator('map[id=123] layer[id=layer1]'),
      expectedMapValue: ['123'],
      expectedMapComparator: '=',
      expectedMapProperty: 'id',
      expectedLayerValue: ['layer1'],
      expectedLayerComparator: '=',
      expectedLayerProperty: 'id',
    },
    // Layer only
    {
      locator: new MapGrabLocator('layer[id=layer1]'),
      expectedMapValue: undefined,
      expectedMapComparator: undefined,
      expectedMapProperty: undefined,
      expectedLayerValue: ['layer1'],
      expectedLayerComparator: '=',
      expectedLayerProperty: 'id',
    },
    {
      locator: new MapGrabLocator('layer[id*=layer1]'),
      expectedMapValue: undefined,
      expectedMapComparator: undefined,
      expectedMapProperty: undefined,
      expectedLayerValue: ['layer1'],
      expectedLayerComparator: '*',
      expectedLayerProperty: 'id',
    },
    {
      locator: new MapGrabLocator('layer[id=[layer1, layer2]]'),
      expectedMapValue: undefined,
      expectedMapComparator: undefined,
      expectedMapProperty: undefined,
      expectedLayerValue: ['layer1', 'layer2'],
      expectedLayerComparator: '=',
      expectedLayerProperty: 'id',
    },
    //Full
    {
      locator: new MapGrabLocator('map[id=123] layer[id=layer1] filter["==", ["get", "id"], 123]'),
      expectedMapValue: ['123'],
      expectedMapComparator: '=',
      expectedMapProperty: 'id',
      expectedLayerValue: ['layer1'],
      expectedLayerComparator: '=',
      expectedLayerProperty: 'id',
      expectedFilter: ['==', ['get', 'id'], 123],
    },
  ])(
    'should correct tokenize locator',
    ({
      locator,
      expectedMapValue,
      expectedMapComparator,
      expectedMapProperty,
      expectedLayerValue,
      expectedLayerComparator,
      expectedLayerProperty,
      expectedFilter,
    }) => {
      if (expectedMapProperty) {
        //Map
        expect(locator.map?.[expectedMapProperty]?.value).toEqual(expectedMapValue);
        expect(locator.map?.[expectedMapProperty]?.comparator).toEqual(expectedMapComparator);
      }

      if (expectedLayerProperty) {
        //Layer
        expect(locator.layer?.[expectedLayerProperty]?.value).toEqual(expectedLayerValue);
        expect(locator.layer?.[expectedLayerProperty]?.comparator).toEqual(expectedLayerComparator);
      }

      //Filter
      expect(locator.filter).toEqual(expectedFilter);
    }
  );
});
