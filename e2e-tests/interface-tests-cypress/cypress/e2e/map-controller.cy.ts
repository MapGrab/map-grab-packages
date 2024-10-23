import { ExposeMutationResult, MapRect, LngLatInterface } from '@mapgrab/map-interface-types';

describe('Map Controller', { testIsolation: false }, () => {
  before(() => {
    cy.visit('http://localhost:4200/mapbox/');
  });

  describe('setView() method', () => {
    it('should set map view', () => {
      cy.mapController('mainMap')
        .then((controller) => controller.setView({ center: [11, 12], zoom: 2 }).then(() => controller))
        .then((controller) => controller.getMapInstance())
        .should((map) => {
          expect(map.getCenter().toArray()).to.have.all.members([11, 12]);
          expect(map.getZoom()).to.eq(2);
        });
    });
  });

  describe('setViewAbsolute() method', () => {
    it('should set map view with absolute coordinates', () => {
      cy.mapController('mainMap')
        .then((controller) => controller.setViewAbsolute({ center: [100, 100], zoom: 3 }).then(() => controller))
        .then((controller) => controller.getMapInstance())
        .should((map) => {
          expect(map.getCenter().toArray()).not.to.have.all.members([100, 100]);
          expect(map.getZoom()).to.eq(3);
        });
    });
  });

  describe('fitMapToBounds() method', () => {
    it('should fit map to bounds', () => {
      cy.mapController('mainMap').then((controller) => {
        controller.getMapInstance().then((map) => {
          cy.spy(map, 'fitBounds').as('fitBounds');
        });
        controller.fitMapToBounds([11, 11, 14, 14], { duration: 11 });

        cy.get('@fitBounds').should('be.calledOnceWithExactly', [11, 11, 14, 14], { animate: false, duration: 11 });
      });
    });
  });

  describe('fitMapToBoundingBox() method', () => {
    it('should fit map to bounding box relative to page', () => {
      cy.mapController('mainMap').then((controller) => {
        let sw: LngLatInterface, ne: LngLatInterface;

        const bbox = new MapRect(20, 20, 40, 40);

        controller.getMapInstance().then((map) => {
          const spy = cy.spy(map, 'fitBounds').as('fitBounds');

          sw = map.unproject([bbox.x, bbox.bottom]);
          ne = map.unproject([bbox.right, bbox.y]);

          controller.fitMapToBoundingBox(bbox, { duration: 11 });

          cy.get('@fitBounds')
            .should('be.calledOnce')
            .then(() => {
              expect(spy.getCalls()[0]?.args[0][0].lat).to.eq(sw.lat);
              expect(spy.getCalls()[0]?.args[0][0].lng).to.eq(sw.lng);

              expect(spy.getCalls()[0]?.args[0][1].lat).to.eq(ne.lat);
              expect(spy.getCalls()[0]?.args[0][1].lng).to.eq(ne.lng);
            });
        });
      });
    });

    it('should fit map to bounding box relative to map container', () => {
      cy.mapController('mainMap').then((controller) => {
        let sw: LngLatInterface, ne: LngLatInterface;

        const bbox = new MapRect(20, 20, 400, 400);

        controller.getMapInstance().then((map) => {
          const spy = cy.spy(map, 'fitBounds').as('fitBounds');

          const { x, y } = map.getCanvasContainer().getBoundingClientRect();

          sw = map.unproject([bbox.x - x, bbox.bottom - y]);
          ne = map.unproject([bbox.right - x, bbox.y - y]);

          controller.fitMapToBoundingBox(bbox, { duration: 11 });

          cy.get('@fitBounds')
            .should('be.calledOnce')
            .then(() => {
              expect(spy.getCalls()[0]?.args[0][0].lat).to.eq(sw.lat);
              expect(spy.getCalls()[0]?.args[0][0].lng).to.eq(sw.lng);

              expect(spy.getCalls()[0]?.args[0][1].lat).to.eq(ne.lat);
              expect(spy.getCalls()[0]?.args[0][1].lng).to.eq(ne.lng);
            });
        });
      });
    });
  });

  describe('exposeLayers() method', () => {
    it('should expose provided layers', () => {
      cy.mapController('mainMap').then((controller) => {
        controller.getMapInstance().then((map) => {
          cy.spy(map, 'setLayoutProperty').as('setLayoutProperty');
        });

        controller.exposeLayers(['countries-label'], ['countries-fill']).should((state) => {
          expect(state).to.eql(<ExposeMutationResult>{ 'countries-fill': { from: 'visible', to: 'none' } });
        });

        cy.get('@setLayoutProperty').should('be.calledWith', 'countries-fill', 'visibility', 'none');
      });
    });
  });

  describe('revertExposeLayers() method', () => {
    it('should expose provided layers', () => {
      cy.reload();

      cy.mapController('mainMap').then((controller) => {
        controller.getMapInstance().then((map) => {
          cy.spy(map, 'setLayoutProperty').as('setLayoutProperty');
        });

        controller.exposeLayers(['countries-label'], ['countries-fill']).then((state) => {
          controller.revertExposeLayers(state);
        });

        cy.get('@setLayoutProperty').should('be.calledWith', 'countries-fill', 'visibility', 'visible');
      });
    });
  });
});
