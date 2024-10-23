//@ts-nocheck
import { MapController } from './map-controller';
import { MapLocator } from './map-locator';

export function mapLocatorCommand(selector: string, opts?: { timeout?: number }) {
  if (opts?.timeout) {
    this.set('timeout', opts?.timeout);
  }

  return (subject: JQuery) => {
    if (subject && !subject.is('iframe')) {
      throw new Error('Parent element must be cy or iframe element');
    }

    const _window: Window = subject ? subject.get(0)?.contentWindow : cy.state('window');
    const dispatchContext = subject ? Cypress.$(_window.document.querySelector('html')) : undefined;

    return new MapLocator(cy, _window, selector, dispatchContext);
  };
}

export const mapControllerCommand = (subject, mapId: string) => {
  if (subject && !subject.is('iframe')) {
    throw new Error('Parent element must be cy or iframe element');
  }

  const _window: Window = subject ? subject.get(0)?.contentWindow : cy.state('window');

  return new MapController(cy, _window, mapId);
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Chainable<Subject> {
      mapLocator(selector: string, opts?: { timeout?: number }): Chainable<MapLocator>;

      mapController(mapId: string): Chainable<MapController>;

      last<E extends Node = HTMLElement>(options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<E>>;
      last<E extends MapLocator>(options?: Partial<Loggable & Timeoutable>): Chainable<E>;

      first<E extends Node = HTMLElement>(options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<E>>;
      first<E extends MapLocator>(options?: Partial<Loggable & Timeoutable>): Chainable<E>;

      eq<E extends Node = HTMLElement>(index: number, options?: Partial<Loggable & Timeoutable>): Chainable<JQuery<E>>;
      eq<E extends MapLocator>(index: number, options?: Partial<Loggable & Timeoutable>): Chainable<E>;

      merge<E extends MapLocator>(mergeFunc?: Parameters<MapLocator['merge']>[0]): Chainable<E>;
    }

    interface Chainer<Subject> {
      (chainer: 'be.visibleOnMap'): Chainable<Subject>;
      (chainer: 'visibleOnMap'): Chainable<Subject>;

      (chainer: 'be.hiddenOnMap'): Chainable<Subject>;
      (chainer: 'hiddenOnMap'): Chainable<Subject>;
    }
  }
}

export function setupCommands(): void {
  Cypress.Commands.addQuery('mapLocator', mapLocatorCommand);
  Cypress.Commands.add('mapController', { prevSubject: 'optional' }, mapControllerCommand);

  Cypress.Commands.overwriteQuery<T>('first', function (originalFunc, ...args) {
    return (subject: T) => {
      if (subject instanceof MapLocator) {
        return subject.first();
      }

      return originalFunc.apply(this, args);
    };
  });

  Cypress.Commands.addQuery<T>('merge', function (mergeFunc: Parameters<MapLocator['merge']>[0]) {
    return (subject: T) => {
      if (subject instanceof MapLocator) {
        return subject.merge(mergeFunc);
      }

      throw new Error('Parent element must be a mapLocator');
    };
  });

  Cypress.Commands.overwriteQuery('last', function (originalFunc, ...args) {
    return (subject) => {
      if (subject instanceof MapLocator) {
        return subject.last();
      }

      return originalFunc.apply(this, args);
    };
  });

  Cypress.Commands.overwriteQuery('eq', function (originalFunc, ...args) {
    return (subject) => {
      if (subject instanceof MapLocator) {
        return subject.nth(args[0]);
      }

      return originalFunc.apply(this, args);
    };
  });

  chai.use((_chai) => {
    function visibleOnMap() {
      this.assert(
        this._obj.countSync() > 0,
        `expected mapLocator(${this._obj.selector}) elements visible`,
        `expected mapLocator(${this._obj.selector}) elements should be visible found hidden`
      );
    }
    _chai.Assertion.addMethod('visibleOnMap', visibleOnMap);
  });

  chai.use((_chai) => {
    function hiddenOnMap() {
      this.assert(
        this._obj.countSync() <= 0,
        `expected mapLocator(${this._obj.selector}) elements should be hidden`,
        `expected mapLocator(${this._obj.selector}) elements should be hidden found visible`
      );
    }
    _chai.Assertion.addMethod('hiddenOnMap', hiddenOnMap);
  });
}
