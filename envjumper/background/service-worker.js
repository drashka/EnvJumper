// EnvJump - https://github.com/<votre-repo>/envjump
// Copyright (C) 2026 <Votre Nom>
// Licence : GPL v3 — voir le fichier LICENSE

/**
 * Service Worker EnvJump.
 * - Notifie les content scripts lors des navigations.
 * - Met à jour le badge de l'icône d'extension en fonction de l'environnement actif.
 * - Gère les menus contextuels (clic droit) pour ouvrir un lien sur un autre environnement.
 */

/**
 * Finds the environment matching a given host (hostname:port) in the groups.
 * Supports direct env domain match, WP Multisite prefix-based subdomains,
 * WP Multisite subdirectory (host = env.domain), and legacy domain-based sites.
 * @param {Array} groups
 * @param {string} host - hostname:port (or just hostname if standard port)
 * @returns {{env: object, group: object}|null}
 */
function findMatch(groups, host) {
  for (const group of groups) {
    // Direct env domain match
    for (const env of group.environments) {
      if (env.domain === host) return { env, group };
    }
    // Current format: WP Multisite with prefix-based sites
    if (group.isWordPressMultisite && group.wpSites) {
      const type = group.wpMultisiteType || 'subdomain';
      for (const env of group.environments) {
        for (const site of group.wpSites) {
          let siteHost;
          if (type === 'subdirectory') {
            siteHost = env.domain; // subdirectory: hostname is env.domain (already matched above)
          } else {
            siteHost = site.prefix ? `${site.prefix}.${env.domain}` : env.domain;
          }
          if (siteHost === host) return { env, group };
        }
      }
    }
    // Legacy: wpSites with domain field at group level
    if (group.isWordPressMultisite && group.wpSites) {
      for (const site of group.wpSites) {
        if (site.domain && site.domain === host) {
          const env = group.environments[0] || null;
          return { env, group };
        }
      }
    }
    // Legacy: wpSites with domain field at env level (oldest format)
    for (const env of group.environments) {
      if (env.isWordPressMultisite && env.wpSites) {
        for (const site of env.wpSites) {
          if (site.domain === host) return { env, group };
        }
      }
    }
  }
  return null;
}

/**
 * Met à jour le badge de l'icône pour un onglet donné.
 * En mode discret, aucun badge n'est affiché.
 * @param {number} tabId
 * @param {string|null} url
 */
async function updateBadge(tabId, url) {
  if (!url || url.startsWith('chrome://') || url.startsWith('about:')) {
    chrome.action.setBadgeText({ tabId, text: '' });
    return;
  }

  // Check stealth mode (stored in local storage — session storage is not accessible to content scripts)
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
    // Env connu : badge coloré, 2 premières lettres en majuscules
    const label = match.env.name.slice(0, 2).toUpperCase();
    chrome.action.setBadgeText({ tabId, text: label });
    chrome.action.setBadgeBackgroundColor({ tabId, color: match.env.color });
  } else {
    // Env inconnu : pas de badge
    chrome.action.setBadgeText({ tabId, text: '' });
  }
}

// ── Context menus ───────────────────────────────────────────────────────────

/**
 * Rebuilds all context menu items based on the current groups configuration.
 * Shows "EnvJump → [Group] → [Env]" when right-clicking a link on a known env page.
 */
async function rebuildContextMenus() {
  return new Promise((resolve) => {
    chrome.contextMenus.removeAll(() => {
      chrome.storage.sync.get(['groups'], ({ groups = [] }) => {
        // Gather all known domains to restrict when the menu appears
        const allDomains = new Set();
        groups.forEach((group) => {
          group.environments.forEach((env) => {
            if (env.domain) allDomains.add(env.domain);
          });
          // WP Multisite subdomains
          if (group.isWordPressMultisite && group.wpSites && group.wpMultisiteType === 'subdomain') {
            group.environments.forEach((env) => {
              (group.wpSites || []).forEach((site) => {
                if (site.prefix) allDomains.add(`${site.prefix}.${env.domain}`);
              });
            });
          }
        });

        if (!allDomains.size) { resolve(); return; }

        const documentUrlPatterns = [...allDomains].flatMap((d) => [
          `http://${d}/*`,
          `https://${d}/*`,
        ]);

        // Root menu item
        chrome.contextMenus.create({
          id: 'envjump-root',
          title: 'EnvJump',
          contexts: ['link'],
          documentUrlPatterns,
        });

        // One item per env per group: "[Group name] → [Env name]"
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

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!info.menuItemId || !String(info.menuItemId).startsWith('envjump-env-')) return;
  const envId = String(info.menuItemId).replace('envjump-env-', '');

  chrome.storage.sync.get(['groups'], ({ groups = [] }) => {
    // Find target env and its group
    let targetEnv = null;
    let targetGroup = null;
    for (const group of groups) {
      for (const env of group.environments) {
        if (env.id === envId) { targetEnv = env; targetGroup = group; break; }
      }
      if (targetEnv) break;
    }
    if (!targetEnv || !info.linkUrl || !tab) return;

    // Verify the current page belongs to the same group
    let currentHost;
    try { currentHost = new URL(tab.url).host; } catch { return; }
    const match = findMatch(groups, currentHost);
    if (!match || match.group.id !== targetGroup.id) return;

    // Build the target URL from the link URL, replacing domain (and optionally protocol)
    try {
      const url = new URL(info.linkUrl);
      const protocol = targetEnv.protocol || 'https';
      url.protocol = protocol + ':';
      // Handle domain with optional port
      if (targetEnv.domain.includes(':')) {
        url.host = targetEnv.domain;
      } else {
        url.hostname = targetEnv.domain;
        // Reset port if switching to standard protocol
        if ((protocol === 'https' && url.port === '443') ||
            (protocol === 'http' && url.port === '80')) {
          url.port = '';
        }
      }
      chrome.tabs.create({ url: url.toString() });
    } catch {}
  });
});

// ── Event listeners ─────────────────────────────────────────────────────────

// Rebuild context menus on first install / update
chrome.runtime.onInstalled.addListener(() => {
  rebuildContextMenus();
});

// Clear stealth mode on browser startup (mimics chrome.storage.session behaviour)
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.remove('stealthMode');
});

// Mise à jour lors du chargement d'une page
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    // Notifier le content script (SPAs)
    if (tab.url && !tab.url.startsWith('chrome://')) {
      chrome.tabs.sendMessage(tabId, { type: 'URL_CHANGED' }).catch(() => {});
    }
    updateBadge(tabId, tab.url);
  }
});

// Mise à jour lors du changement d'onglet actif
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    updateBadge(tabId, tab.url);
  } catch {
    // L'onglet a été fermé avant la résolution de la promesse
  }
});

// Mise à jour quand la config change (l'utilisateur modifie un environnement)
chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area === 'sync') {
    // Rebuild context menus if groups changed
    if (changes.groups) rebuildContextMenus();

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) updateBadge(tab.id, tab.url);
  }

  // Stealth mode changed: refresh badges for all tabs
  if (area === 'local' && 'stealthMode' in changes) {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('about:')) {
        updateBadge(tab.id, tab.url);
      }
    }
  }
});
