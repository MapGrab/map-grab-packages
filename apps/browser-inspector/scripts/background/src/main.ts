import { MapGrabEvents } from '@mapgrab/map-interface-types';

const state: { [key in string]: { activated?: boolean; interfaceInitialized?: boolean } } = {};

function setIcon(tabId: number, icon: string) {
  chrome.action.setIcon({
    tabId,
    path: icon,
  });
}

function executeJS(tabId: number, func: () => void): void {
  chrome.scripting.executeScript({
    target: {
      tabId,
    },
    func,
    world: 'MAIN',
  });
}

function update(tabId: number) {
  if (!state[tabId]) {
    setIcon(tabId, '/images/icon-off/icon32.png');

    return;
  }

  const { activated, interfaceInitialized } = state[tabId]!;

  if (activated && interfaceInitialized) {
    setIcon(tabId, '/images/icon-on/icon32.png');

    executeJS(tabId, () => {
      window.__MAPGRAB__.enableInspector();
    });
  } else if (interfaceInitialized) {
    setIcon(tabId, '/images/base-icon/icon32.png');

    executeJS(tabId, () => {
      window.__MAPGRAB__.disableInspector();
    });
  }
}

chrome.action.onClicked.addListener((tab) => {
  state[tab.id!] = { ...state[tab.id!], activated: !state[tab.id!]?.activated };

  update(tab.id!);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    state[tabId] = { ...(state[tabId] ?? {}), interfaceInitialized: false };

    update(tabId);
  }
});

chrome.runtime.onMessage.addListener(function (request, sender, _sendResponse) {
  if (request === MapGrabEvents.MAP_INTERFACE_INIT) {
    state[sender.tab?.id!] = { ...state[sender.tab?.id!], interfaceInitialized: true };

    update(sender.tab?.id!);
  }
});
