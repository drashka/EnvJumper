// EnvJumper - https://github.com/drashka/EnvJumper
// Copyright (C) 2026 Drashka
// Licence : GPL v3 — voir le fichier LICENSE

import { findMatch } from './utils.js';
import { rebuildContextMenus, initContextMenuListener } from './context-menus.js';

// Initialize context menu click listener once at startup
initContextMenuListener();

// ── Badge ────────────────────────────────────────────────────────────────────

/**
 * Updates the extension icon badge for a given tab.
 * In stealth mode, no badge is shown.
 * @param {number} tabId
 * @param {string|null} url
 */
async function updateBadge(tabId, url) {
  if (!url || url.startsWith('chrome://') || url.startsWith('about:')) {
    chrome.action.setBadgeText({ tabId, text: '' });
    return;
  }

  let host;
  try {
    host = new URL(url).host;
  } catch {
    chrome.action.setBadgeText({ tabId, text: '' });
    return;
  }

  const result = await chrome.storage.local.get(['groups']);
  const groups = result.groups || [];
  const match = findMatch(groups, host);

  if (match && match.env) {
    const words = match.env.name.trim().split(/\s+/);
    const label = words.slice(0, 3).map((w) => w[0]).join('').toUpperCase();
    chrome.action.setBadgeText({ tabId, text: label });
    chrome.action.setBadgeBackgroundColor({ tabId, color: match.env.color });
  } else {
    chrome.action.setBadgeText({ tabId, text: '' });
  }
}

// ── Basic Auth ───────────────────────────────────────────────────────────────

/**
 * In-memory cache of basic auth credentials.
 * Structure: Map<domain, { username, password }>
 * Enables synchronous ("blocking") response to auth challenges.
 */
let authCache = new Map();

async function loadAuthCache() {
  const { groups = [] } = await chrome.storage.local.get('groups');
  authCache.clear();
  for (const group of groups) {
    for (const env of group.environments || []) {
      if (env.basicAuth?.enabled && env.basicAuth.username) {
        authCache.set(env.domain, {
          username: env.basicAuth.username,
          password: env.basicAuth.password || '',
        });
      }
    }
  }
}

loadAuthCache();

/**
 * Request IDs for which credentials were already supplied.
 * A second challenge on the same request means the credentials were rejected:
 * we then let Chrome show its native prompt instead of looping forever.
 */
const answeredRequests = new Set();

chrome.webRequest.onAuthRequired.addListener(
  (details) => {
    // Never hand site credentials to a proxy asking for authentication
    if (details.isProxy) return {};
    if (answeredRequests.has(details.requestId)) return {};
    try {
      const url = new URL(details.url);
      const credentials = authCache.get(url.hostname) || authCache.get(url.host);
      if (credentials) {
        answeredRequests.add(details.requestId);
        return { authCredentials: { username: credentials.username, password: credentials.password } };
      }
    } catch {}
    return {};
  },
  { urls: ['<all_urls>'] },
  ['blocking']
);

const forgetRequest = (details) => answeredRequests.delete(details.requestId);
chrome.webRequest.onCompleted.addListener(forgetRequest, { urls: ['<all_urls>'] });
chrome.webRequest.onErrorOccurred.addListener(forgetRequest, { urls: ['<all_urls>'] });

// ── Content script queries ───────────────────────────────────────────────────

/**
 * Answers GET_ENV_MATCH from the content script with only the color and name
 * of the matching environment, so that credentials never reach web page processes.
 * The host is taken from the sender, not from the message.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== 'GET_ENV_MATCH' || sender.id !== chrome.runtime.id || !sender.url) return false;
  let host;
  try { host = new URL(sender.url).host; } catch { sendResponse(null); return false; }
  chrome.storage.local.get('groups').then(({ groups = [] }) => {
    const match = findMatch(groups, host);
    sendResponse(match ? { color: match.env.color, name: match.env.name } : null);
  });
  return true;
});

/**
 * Asks every tab's content script to refresh its border (after a config change).
 */
async function refreshAllTabs() {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    chrome.tabs.sendMessage(tab.id, { type: 'URL_CHANGED' }).catch(() => {});
  }
}

// ── Event listeners ──────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  rebuildContextMenus();
});


chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    if (tab.url && !tab.url.startsWith('chrome://')) {
      chrome.tabs.sendMessage(tabId, { type: 'URL_CHANGED' }).catch(() => {});
    }
    updateBadge(tabId, tab.url);
  }
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    updateBadge(tabId, tab.url);
  } catch {}
});

chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area === 'local' && changes.groups) {
    rebuildContextMenus();
    loadAuthCache();
    refreshAllTabs();
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) updateBadge(tab.id, tab.url);
  }
  if (area === 'sync' && changes.settings) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) updateBadge(tab.id, tab.url);
  }
});
