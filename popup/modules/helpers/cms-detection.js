// EnvJumper - https://github.com/drashka/EnvJumper
// Copyright (C) 2026 Drashka
// Licence : GPL v3 — voir le fichier LICENSE

/**
 * Returns the active tab if its hostname matches one of the group's environments.
 * @param {object} group
 * @returns {Promise<chrome.tabs.Tab|null>}
 */
export async function getActiveTabMatchingGroup(group) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return null;
    const url = new URL(tab.url);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    const matches = (group.environments || []).some((env) => env.domain === url.hostname);
    return matches ? tab : null;
  } catch {
    return null;
  }
}

/**
 * Injects the CMS detection script into the given tab.
 * Returns the detection result, or null on failure (protected pages, CSP, etc.).
 * @param {number} tabId
 * @returns {Promise<{cms: string|null, isMultisite: boolean, multisiteSites: Array, multisiteType: string|null}|null>}
 */
export async function detectCmsOnTab(tabId) {
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId },
      func: _detectCmsFn,
    });
    return result ?? null;
  } catch {
    return null;
  }
}

/**
 * Applies a CMS detection result to a group object (mutates it in place) and persists to storage.
 * Safe to call even if result.cms is null — does nothing in that case.
 * @param {{cms: string|null, isMultisite: boolean, multisiteSites: Array, multisiteType: string|null}} result
 * @param {object} group
 */
export async function applyDetectionToGroup(result, group) {
  if (!result?.cms) return;

  const { CMS_DEFAULT_ADMIN_PATH, getDefaultCmsLinks, getDefaultNetworkLinks } = await import('../projects/cms.js');
  const { getGroups, saveGroups } = await import('./storage.js');

  group.cms = result.cms;
  group.cmsAdminPath = CMS_DEFAULT_ADMIN_PATH[result.cms] || '';
  group.links = [...getDefaultCmsLinks(result.cms, group.cmsAdminPath), ...(group.links || [])];

  if (result.cms === 'wordpress' && result.isMultisite) {
    group.isWordPressMultisite = true;
    if (result.multisiteType) group.wpMultisiteType = result.multisiteType;

    if (result.multisiteSites?.length > 0) {
      const mainDomain = group.environments[0]?.domain || '';
      group.wpSites = result.multisiteSites.map((s) => ({
        label: s.label,
        prefix: _computePrefix(s, result.multisiteType, mainDomain),
      }));
      group.links = [...group.links, ...getDefaultNetworkLinks()];
    }
  }

  const groups = await getGroups();
  const g = groups.find((x) => x.id === group.id);
  if (g) { Object.assign(g, group); await saveGroups(groups); }
}

/**
 * Computes the wpSites prefix from a detected site entry.
 * @param {{domain: string, path: string}} site
 * @param {string} multisiteType
 * @param {string} mainDomain
 */
export function computeSitePrefix(site, multisiteType, mainDomain) {
  return _computePrefix(site, multisiteType, mainDomain);
}

function _computePrefix(site, multisiteType, mainDomain) {
  if (multisiteType === 'subdirectory') return site.path || '';
  if (site.domain.endsWith('.' + mainDomain)) {
    return site.domain.slice(0, -(mainDomain.length + 1));
  }
  return '';
}

/**
 * Detection function injected into the target page via chrome.scripting.executeScript.
 * Must be fully self-contained (no closures, no imports).
 */
function _detectCmsFn() {
  const html = document.documentElement.innerHTML;
  const generator = document.querySelector('meta[name="generator"]')?.content || '';

  let cms = null;
  let isMultisite = false;
  let multisiteSites = [];
  let multisiteType = null;

  if (generator.includes('WordPress') || html.includes('/wp-content/') || html.includes('/wp-includes/')) {
    cms = 'wordpress';
    if (
      document.body.classList.contains('multisite')
      || html.includes('/wp-admin/network/')
      || document.querySelector('#wp-admin-bar-my-sites')
    ) {
      isMultisite = true;
      document.querySelectorAll('#wp-admin-bar-my-sites-list > li').forEach((li) => {
        try {
          const topLink = li.querySelector(':scope > a.ab-item');
          if (!topLink) return;
          // Extract label from text nodes only (skip arrow span and blavatar div)
          const label = Array.from(topLink.childNodes)
            .filter((n) => n.nodeType === 3)
            .map((n) => n.textContent.trim())
            .join('').trim() || topLink.textContent.trim();
          // Use "visit site" link (id ending in "-v") for a clean URL without /wp-admin/
          const visitLink = li.querySelector('[id$="-v"] a');
          const url = new URL((visitLink || topLink).href);
          multisiteSites.push({
            label,
            domain: url.hostname,
            path: url.pathname.replace(/^\/|\/$/g, ''),
          });
        } catch {}
      });
      if (multisiteSites.length > 1) {
        const domains = new Set(multisiteSites.map((s) => s.domain));
        multisiteType = domains.size > 1 ? 'subdomain' : 'subdirectory';
      }
    }
  } else if (generator.includes('Joomla') || html.includes('/media/jui/')) {
    cms = 'joomla';
  } else if (generator.includes('Drupal') || html.includes('Drupal.settings') || html.includes('data-drupal-')) {
    cms = 'drupal';
  } else if (generator.includes('PrestaShop') || html.includes('prestashop')) {
    cms = 'prestashop';
  } else if (html.includes('text/x-magento-init') || html.includes('Mage.Cookies')) {
    cms = 'magento';
  } else if (html.includes('Shopify.theme') || html.includes('cdn.shopify.com')) {
    cms = 'shopify';
  }

  return { cms, isMultisite, multisiteSites, multisiteType };
}
