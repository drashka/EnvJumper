// EnvJump - https://github.com/<votre-repo>/envjump
// Copyright (C) 2026 <Votre Nom>
// Licence : GPL v3 — voir le fichier LICENSE

/**
 * Service Worker EnvJump.
 * - Notifie les content scripts lors des navigations.
 * - Met à jour le badge de l'icône d'extension en fonction de l'environnement actif.
 */

/**
 * Finds the environment matching a given hostname in the groups.
 * Supports direct env domain match, WP Multisite prefix-based subdomains,
 * WP Multisite subdirectory (hostname = env.domain), and legacy domain-based sites.
 * @param {Array} groups
 * @param {string} hostname
 * @returns {{env: object, group: object}|null}
 */
function findMatch(groups, hostname) {
  for (const group of groups) {
    // Direct env domain match
    for (const env of group.environments) {
      if (env.domain === hostname) return { env, group };
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
          if (siteHost === hostname) return { env, group };
        }
      }
    }
    // Legacy: wpSites with domain field at group level
    if (group.isWordPressMultisite && group.wpSites) {
      for (const site of group.wpSites) {
        if (site.domain && site.domain === hostname) {
          const env = group.environments[0] || null;
          return { env, group };
        }
      }
    }
    // Legacy: wpSites with domain field at env level (oldest format)
    for (const env of group.environments) {
      if (env.isWordPressMultisite && env.wpSites) {
        for (const site of env.wpSites) {
          if (site.domain === hostname) return { env, group };
        }
      }
    }
  }
  return null;
}

/**
 * Met à jour le badge de l'icône pour un onglet donné.
 * - Env connu   → badge coloré avec les 2 premières lettres du nom
 * - Env inconnu → badge vide
 * @param {number} tabId
 * @param {string|null} url
 */
async function updateBadge(tabId, url) {
  if (!url || url.startsWith('chrome://') || url.startsWith('about:')) {
    chrome.action.setBadgeText({ tabId, text: '' });
    return;
  }

  let hostname;
  try {
    hostname = new URL(url).hostname;
  } catch {
    chrome.action.setBadgeText({ tabId, text: '' });
    return;
  }

  const result = await chrome.storage.sync.get(['groups']);
  const groups = result.groups || [];
  const match = findMatch(groups, hostname);

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
chrome.storage.onChanged.addListener(async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) updateBadge(tab.id, tab.url);
});
