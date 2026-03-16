// EnvJump - https://github.com/<votre-repo>/envjump
// Copyright (C) 2026 <Votre Nom>
// Licence : GPL v3 — voir le fichier LICENSE

/**
 * Service Worker EnvJump.
 * - Notifie les content scripts lors des navigations.
 * - Met à jour le badge de l'icône d'extension en fonction de l'environnement actif.
 */

/**
 * Trouve l'environnement correspondant à un hostname dans les groupes.
 * Format actuel : wpSites au niveau du groupe.
 * Rétrocompatibilité : wpSites au niveau de l'env (ancien format).
 * @param {Array} groups
 * @param {string} hostname
 * @returns {{env: object, group: object}|null}
 */
function findMatch(groups, hostname) {
  for (const group of groups) {
    for (const env of group.environments) {
      if (env.domain === hostname) return { env, group };
    }
    // Format actuel : wpSites au niveau du groupe
    if (group.isWordPressMultisite && group.wpSites) {
      for (const site of group.wpSites) {
        if (site.domain === hostname) {
          const env = group.environments[0] || null;
          return { env, group };
        }
      }
    }
    // Rétrocompatibilité : wpSites au niveau de l'env (ancien format)
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
