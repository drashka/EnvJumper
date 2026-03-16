// EnvJumper - https://github.com/drashka/EnvJumper
// Copyright (C) 2026 Drashka
// Licence : GPL v3 — voir le fichier LICENSE

import { findMatch } from './utils.js';

let rebuildMenusTimer = null;

/**
 * Rebuilds all context menu items based on the current groups configuration.
 * Debounced to avoid duplicate-id errors on rapid storage changes.
 */
export function rebuildContextMenus() {
  clearTimeout(rebuildMenusTimer);
  rebuildMenusTimer = setTimeout(_doRebuildContextMenus, 100);
}

async function _doRebuildContextMenus() {
  return new Promise((resolve) => {
    chrome.contextMenus.removeAll(() => {
      chrome.storage.sync.get(['groups'], ({ groups = [] }) => {
        const allDomains = new Set();
        groups.forEach((group) => {
          group.environments.forEach((env) => { if (env.domain) allDomains.add(env.domain); });
          if (group.isWordPressMultisite && group.wpSites && group.wpMultisiteType === 'subdomain') {
            group.environments.forEach((env) => {
              (group.wpSites || []).forEach((site) => { if (site.prefix) allDomains.add(`${site.prefix}.${env.domain}`); });
            });
          }
        });

        if (!allDomains.size) { resolve(); return; }

        const documentUrlPatterns = [...allDomains].flatMap((d) => [`http://${d}/*`, `https://${d}/*`]);

        chrome.contextMenus.create({ id: 'envjump-root', title: 'EnvJumper', contexts: ['link'], documentUrlPatterns });

        groups.forEach((group) => {
          (group.environments || []).forEach((env) => {
            if (!env.domain) return;
            chrome.contextMenus.create({
              id: `envjump-env-${env.id}`,
              parentId: 'envjump-root',
              title: `${group.name} → ${env.name}`,
              contexts: ['link'],
              documentUrlPatterns,
            });
          });
        });

        resolve();
      });
    });
  });
}

/**
 * Registers the context menu click handler.
 * Must be called once at service worker startup.
 */
export function initContextMenuListener() {
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (!info.menuItemId || !String(info.menuItemId).startsWith('envjump-env-')) return;
    const envId = String(info.menuItemId).replace('envjump-env-', '');

    chrome.storage.sync.get(['groups'], ({ groups = [] }) => {
      let targetEnv = null;
      let targetGroup = null;
      for (const group of groups) {
        for (const env of group.environments) {
          if (env.id === envId) { targetEnv = env; targetGroup = group; break; }
        }
        if (targetEnv) break;
      }
      if (!targetEnv || !info.linkUrl || !tab) return;

      let currentHost;
      try { currentHost = new URL(tab.url).host; } catch { return; }
      const match = findMatch(groups, currentHost);
      if (!match || match.group.id !== targetGroup.id) return;

      try {
        const url = new URL(info.linkUrl);
        const protocol = targetEnv.protocol || 'https';
        url.protocol = protocol + ':';
        if (targetEnv.domain.includes(':')) {
          url.host = targetEnv.domain;
        } else {
          url.hostname = targetEnv.domain;
          if ((protocol === 'https' && url.port === '443') || (protocol === 'http' && url.port === '80')) {
            url.port = '';
          }
        }
        chrome.tabs.create({ url: url.toString() });
      } catch {}
    });
  });
}
