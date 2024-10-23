import { faker } from '@faker-js/faker';
import { MapLocator } from '@mapgrab/cypress';
import { featureCollection, point } from '@turf/turf';
import { LayerSpecification, SourceSpecification } from 'maplibre-gl';

import { addMapReSource, createEventHandler } from '../support/map-utils';

const addGoblins = (layerId = 'goblins', delay = 2000) => {
  const source: { id: string; spec: SourceSpecification } = {
    id: layerId,
    spec: {
      type: 'geojson',
      data: featureCollection([
        point([faker.location.longitude({ min: -160, max: 160 }), faker.location.latitude({ max: 60, min: -60 })], {
          goblinName: faker.person.fullName(),
        }),
        point([faker.location.longitude({ min: -160, max: 160 }), faker.location.latitude({ max: 60, min: -60 })], {
          goblinName: faker.person.fullName(),
        }),
      ]),
    },
  };
  const layer: LayerSpecification = {
    id: layerId,
    type: 'circle',
    source: source.id,
    paint: { 'circle-radius': 5 },
  };

  addMapReSource(cy, 'mainMap', { source, layer }, true, delay);
};

describe('Map Locator Test', { testIsolation: false }, () => {
  describe('on static map view', () => {
    before(() => {
      cy.visit('http://localhost:4200/maplibre/');
      return cy
        .mapController('mainMap')
        .then((c) => c.getMapInstance())
        .then((map) => {
          map.doubleClickZoom.disable();
        });
    });

    describe('click() method', () => {
      it('should click elements on map', () => {
        createEventHandler(cy, 'mainMap', 'click', 'geolines-label')
          .then((event) => {
            return cy
              .mapLocator('map[id=mainMap] layer[id=geolines-label] filter["==", ["get", "name"], "Equator"]')
              .first<MapLocator>()
              .then((locator) => locator.click())
              .then(() => event);
          })
          .should('to.deep.equal', { type: 'click' });
      });

      it('should click merged elements on map', () => {
        createEventHandler(cy, 'mainMap', 'click', 'geolines-label')
          .then((event) => {
            return cy
              .mapLocator('map[id=mainMap] layer[id=geolines-label] filter["==", ["get", "name"], "Equator"]')
              .then((locator) => locator.merge().click())
              .then(() => event);
          })
          .should('to.deep.equal', { type: 'click' });
      });

      it('should be retry-ability', () => {
        const layerId = 'super-goblins';

        addGoblins(layerId);

        createEventHandler(cy, 'mainMap', 'click', layerId)
          .then((event) => {
            return cy
              .mapLocator(`map[id=mainMap] layer[id=${layerId}]`)
              .then((locator) => locator.first().click())
              .then(() => event);
          })
          .should('to.deep.equal', { type: 'click' });
      });
    });

    describe('dblclick() method', () => {
      it('should dblclick elements on map', () => {
        createEventHandler(cy, 'mainMap', 'dblclick', 'geolines-label')
          .then((event) => {
            return cy
              .mapLocator('map[id=mainMap] layer[id=geolines-label] filter["==", ["get", "name"], "Equator"]')
              .first<MapLocator>()
              .then((locator) => locator.dblclick())
              .then(() => event);
          })
          .should('to.deep.equal', { type: 'dblclick' });
      });
    });

    describe('rightclick() method', () => {
      it('should dblclick elements on map', () => {
        createEventHandler(cy, 'mainMap', 'contextmenu', 'geolines-label')
          .then((event) => {
            cy.mapLocator('map[id=mainMap] layer[id=geolines-label] filter["==", ["get", "name"], "Equator"]')
              .first<MapLocator>()
              .then((locator) => locator.rightclick())
              .then(() => event);
          })
          .should('to.deep.equal', { type: 'contextmenu' });
      });
    });

    describe('boundingBox() method', () => {
      it('should return correct bounding box elements on map', () => {
        const toEqual = { x: 88, y: 321, width: 51, height: 18, right: 139, bottom: 339 };

        cy.mapLocator('map[id=mainMap] layer[id=geolines-label] filter["==", ["get", "name"], "Equator"]')
          .first<MapLocator>()
          .then((locator) => locator.boundingBox())
          .should('to.deep.include', toEqual);

        cy.mapLocator('map[id=mainMap] layer[id=geolines-label] filter["==", ["get", "name"], "Equator"]')
          .first<MapLocator>()
          .then((locator) => locator.boundingBoxSync())
          .should('to.deep.include', toEqual);
      });
    });

    describe('count() and countSync() method', () => {
      it('should return correct count elements on mapxx', () => {
        cy.mapLocator('map[id=mainMap] layer[id=geolines-label] filter["==", ["get", "name"], "Equator"]')
          .then((l) => l.count())
          .should('have.eq', 4);

        cy.mapLocator('map[id=mainMap] layer[id=geolines-label] filter["==", ["get", "name"], "Equator"]')
          .then((l) => l.countSync())
          .should('have.eq', 4);
      });
    });

    describe('merge() method', () => {
      it('should merge and return correct count and merged elements on map', () => {
        cy.mapLocator('map[id=mainMap] layer[id=geolines-label] filter["==", ["get", "name"], "Equator"]').then((l) => {
          const toEqual = { x: 88, y: 321, width: 51, height: 18, right: 139, bottom: 339 };

          l.count().should('have.eq', 4);
          l.first().boundingBox().should('to.deep.include', toEqual);
        });

        cy.mapLocator('map[id=mainMap] layer[id=geolines-label] filter["==", ["get", "name"], "Equator"]').then((l) => {
          const toEqual = { x: 88, y: 321, width: 813, height: 18, right: 901, bottom: 339 };

          l.merge().boundingBox().should('to.deep.include', toEqual);
          l.merge().count().should('have.eq', 1);
        });
      });
    });

    describe('first() method', () => {
      it('should return first matched element', () => {
        cy.mapLocator('map[id=mainMap] layer[id=geolines-label] filter["==", ["get", "name"], "Equator"]')
          .first<MapLocator>()
          .then((l) => {
            const toEqual = { x: 88, y: 321, width: 51, height: 18, right: 139, bottom: 339 };

            l.count().should('have.eq', 1);
            l.boundingBox().should('to.deep.include', toEqual);
          });
      });
    });

    describe('last() method', () => {
      it('should return last matched element', () => {
        cy.mapLocator('map[id=mainMap] layer[id=geolines-label] filter["==", ["get", "name"], "Equator"]')
          .last<MapLocator>()
          .then((l) => {
            const toEqual = { x: 850, y: 321, width: 51, height: 18, right: 901, bottom: 339 };

            l.count().should('have.eq', 1);
            l.boundingBox().should('to.deep.include', toEqual);
          });
      });
    });

    describe('eq(n) method', () => {
      it('should return index matched element', () => {
        cy.mapLocator('map[id=mainMap] layer[id=geolines-label] filter["==", ["get", "name"], "Equator"]')
          .eq<MapLocator>(0)
          .then((l) => l.boundingBox())
          .then((eqLocator) => {
            cy.mapLocator('map[id=mainMap] layer[id=geolines-label] filter["==", ["get", "name"], "Equator"]')
              .first<MapLocator>()
              .then((firstLocator) => firstLocator.boundingBox())
              .should('to.deep.include', eqLocator);
          });

        cy.mapLocator('map[id=mainMap] layer[id=geolines-label] filter["==", ["get", "name"], "Equator"]')
          .eq<MapLocator>(-1)
          .then((l) => l.boundingBox())
          .then((eqLocator) => {
            cy.mapLocator('map[id=mainMap] layer[id=geolines-label] filter["==", ["get", "name"], "Equator"]')
              .last<MapLocator>()
              .then((lastLocator) => lastLocator.boundingBox())
              .should('to.deep.include', eqLocator);
          });
      });
    });

    describe('retry-ability', () => {
      it('locator should be retry ability on assertions', () => {
        const layerId = 'goblins';
        addGoblins(layerId);

        // Hidden until elements has not be added to map
        cy.mapLocator(`map[id=mainMap] layer[id=${layerId}]`).should('to.be.hiddenOnMap');
        cy.mapLocator(`map[id=mainMap] layer[id=${layerId}]`).should('to.be.visibleOnMap');
        cy.mapLocator(`map[id=mainMap] layer[id=${layerId}]`).should('have.length', 2);
      });
    });
  });

  describe('in iframe', () => {
    before(() => {
      cy.visit('http://localhost:4200/maplibre/iframe');
    });

    it('MapLocator should work', () => {
      createEventHandler(cy.get('iframe'), 'mainMap', 'click', 'geolines-label')
        .then((event) => {
          return cy
            .get('iframe')
            .mapLocator('map[id=mainMap] layer[id=geolines-label] filter["==", ["get", "name"], "Equator"]')
            .first<MapLocator>()
            .then((locator) => locator.click())
            .then(() => event);
        })
        .should('to.deep.equal', { type: 'click' });

      cy.get('iframe')
        .mapLocator('map[id=mainMap] layer[id=geolines-label] filter["==", ["get", "name"], "Equator"]')
        .first<MapLocator>()
        .then((locator) => locator.boundingBox({ relativeTo: 'rootWindow' }))
        .should('deep.equal', {
          x: 322,
          y: 378,
          right: 351,
          bottom: 396,
          width: 29,
          height: 18,
        });
    });
  });
});
