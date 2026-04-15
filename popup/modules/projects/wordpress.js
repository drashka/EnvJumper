// EnvJumper - https://github.com/drashka/EnvJumper
// Copyright (C) 2026 Drashka
// Licence : GPL v3 — voir le fichier LICENSE

/**
 * Builds a multisite URL from an env domain, a site prefix, the multisite type, and a path.
 * @param {string} envDomain - e.g. "monsite.com"
 * @param {string} prefix - e.g. "fr" or "" for the main site
 * @param {string} type - "subdomain" or "subdirectory"
 * @param {string} path - e.g. "/wp-admin/"
 * @param {string} [protocol='https'] - "https" or "http"
 * @returns {string}
 */
export function buildMultisiteUrl(envDomain, prefix, type, path, protocol) {
  const proto = protocol || 'https';
  if (type === 'subdirectory') {
    const base = prefix ? `${envDomain}/${prefix}` : envDomain;
    return `${proto}://${base}${path}`;
  }
  // default: subdomain
  const host = prefix ? `${prefix}.${envDomain}` : envDomain;
  return `${proto}://${host}${path}`;
}

/**
 * Queries the content script to determine whether the user is logged
 * in to WordPress on the given tab.
 * @param {number} tabId
 * @returns {Promise<boolean|null>} true / false, or null if unknown
 */
export async function getWpLoginStatus(tabId) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, { type: 'GET_WP_STATUS' }, (response) => {
      if (chrome.runtime.lastError || !response) {
        resolve(null); // unknown
      } else {
        resolve(!!response.isLoggedIn);
      }
    });
  });
}
