import { MapGrabEvents } from '@mapgrab/map-interface-types';

const state: { [key in string]: { activated?: boolean; interfaceInitialized?: boolean } } = {};

function setIcon(tabId: number, icon: string) {
  chrome.action.setIcon({
    tabId,
    path: `/images/${icon}`,
  });
}

const executeJS = <T>(tabId: number, func: () => T) =>
  new Promise<chrome.scripting.InjectionResult<chrome.scripting.Awaited<T>>[]>((resolve) => {
    chrome.scripting.executeScript({ target: { tabId }, func, world: 'MAIN' }, resolve);
  }).then((r) => (r ? r : []));

function update(tabId: number) {
  if (!state[tabId]?.interfaceInitialized) {
    setIcon(tabId, 'icon-off/icon32.png');

    return;
  }

  const { activated, interfaceInitialized } = state[tabId]!;

  if (activated && interfaceInitialized) {
    setIcon(tabId, 'icon-on/icon32.png');

    executeJS(tabId, () => {
      window.__MAPGRAB__.enableInspector();
    });
  } else if (interfaceInitialized) {
    setIcon(tabId, 'base-icon/icon32.png');

    executeJS(tabId, () => {
      window.__MAPGRAB__.disableInspector();
    });
  }
}

function checkInterfaceInitialized(tabId: number) {
  executeJS(tabId, () => {
    return !!window.__MAPGRAB__?.enableInspector as boolean;
  }).then(([initialized]) => {
    if (initialized != null && ((!state[tabId] && initialized.result) || state[tabId])) {
      state[tabId] = { ...(state[tabId] || {}), interfaceInitialized: initialized.result };

      update(tabId);
    }
  });
}

const canExecute = (tab: chrome.tabs.Tab) => tab.url?.startsWith('http');

chrome.action.onClicked.addListener((tab) => {
  if (canExecute(tab) && tab.id != null && state[tab.id]?.interfaceInitialized) {
    state[tab.id]!.activated = !state[tab.id!]?.activated;

    update(tab.id);
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (canExecute(tab) && changeInfo.status === 'loading') {
    checkInterfaceInitialized(tabId);
  }
});

chrome.runtime.onMessage.addListener(function (request, sender, _sendResponse) {
  if (request === MapGrabEvents.MAP_INTERFACE_INIT) {
    checkInterfaceInitialized(sender.tab?.id!);
  }
});
