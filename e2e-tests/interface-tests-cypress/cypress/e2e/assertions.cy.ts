describe('Assertions', { testIsolation: false }, () => {
  const egyptSelector = 'layer[id=countries-fill] filter["==", ["get", "NAME"], "Egypt"]';

  before(() => {
    cy.visit('http://localhost:4200/mapbox/');
  });

  describe('toBeVisibleOnMap', () => {
    it('should pass when element is visible on map', () => {
      cy.mapLocator(egyptSelector).should('be.visibleOnMap');
      cy.mapLocator(egyptSelector).should('visibleOnMap');
    });

    it('should throw when element is not visible on map', () => {
      cy.mapController('mainMap').then((c) => c.setView({ center: [11, 12], zoom: 11 }));

      cy.mapLocator(egyptSelector).should('not.be.visibleOnMap');
      cy.mapLocator(egyptSelector).should('not.visibleOnMap');
    });
  });

  describe('toBeHiddenOnMap', () => {
    it('should pass when element is not visible on map', () => {
      cy.mapController('mainMap').then((c) => c.setView({ center: [11, 12], zoom: 11 }));

      cy.mapLocator(egyptSelector).should('be.hiddenOnMap');
      cy.mapLocator(egyptSelector).should('hiddenOnMap');
    });

    it('should throw when element is visible on map', () => {
      cy.mapController('mainMap').then((c) => c.setView({ center: [0, 0], zoom: 1 }));

      cy.mapLocator(egyptSelector).should('not.be.hiddenOnMap');
      cy.mapLocator(egyptSelector).should('not.hiddenOnMap');
    });
  });

  describe('length', () => {
    it('should match elements count on map', () => {
      const selector = 'map[id=mainMap] layer[id=countries-fill]';

      cy.mapLocator(selector).should('have.length', 245);
      cy.mapLocator(selector).merge().should('have.length', 1);
      cy.mapLocator(selector).first().should('have.length', 1);
      cy.mapLocator(selector).last().should('have.length', 1);
      cy.mapLocator(selector).eq(1).should('have.length', 1);
      cy.mapLocator(selector).should('have.length.gte', 245);

      cy.mapController('mainMap').then((c) => c.setView({ center: [11, 12], zoom: 13 }));
      cy.mapLocator(selector).should('have.length', 1);
    });
  });
});
