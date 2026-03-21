import { chromium } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';
import os from 'os';

// Resolve extension path relative to this file (tests/helpers/ → project root)
// More reliable than process.cwd() which depends on where the command is run from.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const EXTENSION_PATH = path.resolve(__dirname, '../..');

/**
 * Launches a persistent Chromium context with the extension loaded.
 * Uses a dedicated temp directory to avoid polluting any real Chrome profile.
 */
export async function launchBrowserWithExtension() {
  const userDataDir = path.join(os.tmpdir(), `pw-envjumper-${Date.now()}`);

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    locale: 'fr-FR',
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      '--no-first-run',
      '--disable-default-apps',
      '--lang=fr-FR',
      // CI stability: prevent Chrome from crashing due to limited /dev/shm on Linux runners
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-sandbox',
    ],
  });

  const serviceWorker = context.serviceWorkers()[0]
    || await context.waitForEvent('serviceworker');
  const extensionId = serviceWorker.url().split('/')[2];

  return { context, extensionId };
}

/**
 * Opens the extension popup as a regular page and waits until the i18n
 * strings are applied (so tab buttons have their correct text content).
 *
 * Note: the popup is opened as a new tab, which becomes the active tab.
 * Tests that depend on chrome.tabs.query({ active: true }) reading a specific
 * URL must use openPopupWithActiveTab() instead.
 */
export async function openPopup(context, extensionId) {
  const popupPage = await context.newPage();
  // Prevent window.close() from closing the Playwright tab: when the popup is
  // opened as a regular tab (not a real extension popup), chrome.tabs.update
  // with undefined tabId navigates the popup tab itself, then window.close()
  // would destroy it — making subsequent locator calls throw "page closed".
  await popupPage.addInitScript(() => {
    // Prevent window.close() from closing the Playwright tab.
    window.close = () => {};
    // Prevent chrome.tabs.update/create from navigating the popup tab itself
    // (when tabId is undefined, Chrome navigates the current active tab — which
    // is this popup tab when opened as a regular Playwright page).
    const _origUpdate = chrome.tabs.update.bind(chrome.tabs);
    chrome.tabs.update = (tabId, props, cb) => {
      if (tabId === undefined || tabId === null) return Promise.resolve({});
      return _origUpdate(tabId, props, cb);
    };
  });
  await popupPage.goto(`chrome-extension://${extensionId}/popup/popup.html`);
  // Wait until renderJumperPanel() has completed: all code paths end with
  // hide('jumper-loading'), so the hidden class on #jumper-loading is the
  // reliable signal that the popup is fully initialised and safe to interact with.
  await popupPage.waitForFunction(
    () => document.getElementById('jumper-loading')?.classList.contains('hidden'),
  );
  return popupPage;
}

/**
 * Opens the extension popup while mocking chrome.tabs.query to return a
 * specific URL as the "active tab". This is necessary in Playwright because
 * the popup is opened as a regular tab (which becomes the active tab),
 * preventing the extension from detecting any real page URL.
 *
 * @param {import('@playwright/test').BrowserContext} context
 * @param {string} extensionId
 * @param {string} activeTabUrl - URL to simulate as the active tab
 */
export async function openPopupWithActiveTab(context, extensionId, activeTabUrl) {
  const popupPage = await context.newPage();

  // Inject mock before popup scripts run so renderJumperPanel sees the fake URL
  await popupPage.addInitScript((url) => {
    try {
      // Prevent window.close() and chrome.tabs.update from closing/navigating the tab
      window.close = () => {};
      const _origUpdate = chrome.tabs.update.bind(chrome.tabs);
      chrome.tabs.update = (tabId, props, cb) => {
        if (tabId === undefined || tabId === null) return Promise.resolve({});
        return _origUpdate(tabId, props, cb);
      };
      const origQuery = chrome.tabs.query.bind(chrome.tabs);
      chrome.tabs.query = function (queryInfo, callback) {
        if (queryInfo && queryInfo.active) {
          const tab = [{ id: 1, url, active: true, windowId: 1, title: 'Test Page' }];
          if (typeof callback === 'function') { callback(tab); return; }
          return Promise.resolve(tab);
        }
        return origQuery(queryInfo, callback);
      };
    } catch (_) { /* ignore if override fails */ }
  }, activeTabUrl);

  await popupPage.goto(`chrome-extension://${extensionId}/popup/popup.html`);
  // Same as openPopup: wait for renderJumperPanel() to complete.
  await popupPage.waitForFunction(
    () => document.getElementById('jumper-loading')?.classList.contains('hidden'),
  );
  return popupPage;
}

/**
 * Clears all extension storage via the service worker (no popup needed).
 * Call between tests for isolation.
 * @param {import('@playwright/test').BrowserContext} context
 */
export async function clearStorage(context) {
  const sw = context.serviceWorkers()[0];
  await sw.evaluate(() => new Promise((resolve) => {
    chrome.storage.local.clear(() => chrome.storage.sync.clear(resolve));
  }));
}
