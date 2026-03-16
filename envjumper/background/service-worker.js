// EnvJumper - https://github.com/<votre-repo>/envjump
// Copyright (C) 2026 <Votre Nom>
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

  const localResult = await chrome.storage.local.get(['stealthMode']);
  if (localResult.stealthMode) {
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

  const result = await chrome.storage.sync.get(['groups']);
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
  const { groups = [] } = await chrome.storage.sync.get('groups');
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

chrome.webRequest.onAuthRequired.addListener(
  (details) => {
    try {
      const url = new URL(details.url);
      const credentials = authCache.get(url.hostname) || authCache.get(url.host);
      if (credentials) {
        return { authCredentials: { username: credentials.username, password: credentials.password } };
      }
    } catch {}
    return {};
  },
  { urls: ['<all_urls>'] },
  ['blocking']
);

// ── Event listeners ──────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  rebuildContextMenus();
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.remove('stealthMode');
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
  if (area === 'sync') {
    if (changes.groups) {
      rebuildContextMenus();
      loadAuthCache();
    }
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) updateBadge(tab.id, tab.url);
  }

  if (area === 'local' && 'stealthMode' in changes) {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('about:')) {
        updateBadge(tab.id, tab.url);
      }
    }
  }
});
