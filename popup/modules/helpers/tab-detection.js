// EnvJumper - https://github.com/drashka/EnvJumper
// Copyright (C) 2026 Drashka
// Licence : GPL v3 — voir le fichier LICENSE

// Dev TLDs treated as environment variants, not real TLDs
const DEV_TLDS = new Set(['local', 'test', 'dev', 'localhost', 'internal']);

// Subdomain and TLD extension → environment name mapping
const ENV_DETECTION_MAP = {
  www: 'Production',
  staging: 'Staging',
  preprod: 'Staging',
  recette: 'Staging',
  dev: 'Dev',
  develop: 'Dev',
  test: 'Test',
  qa: 'Test',
  local: 'Local',
};

/**
 * Extracts the root project name from a hostname.
 * Handles dev TLDs (.local, .test, .dev, etc.) and standard domains.
 * e.g. "staging.cegid.com" → "cegid", "cegid.local" → "cegid"
 * @param {string} hostname
 * @returns {string}
 */
function rootNameFromHostname(hostname) {
  const host = hostname.split(':')[0].toLowerCase();
  const parts = host.split('.');
  if (parts.length === 1) return parts[0];
  const last = parts[parts.length - 1];
  // If last part is a dev TLD, root name is the part immediately before it
  if (DEV_TLDS.has(last)) {
    return parts.length >= 2 ? parts[parts.length - 2] : parts[0];
  }
  // Standard domain: second-to-last part (before the real TLD)
  return parts.length >= 2 ? parts[parts.length - 2] : parts[0];
}

/**
 * Derives the environment name from a detected hostname.
 * Handles both subdomain patterns and dev TLD patterns.
 * @param {string} hostname
 * @returns {string}
 */
function envNameFromDetectedHostname(hostname) {
  const host = hostname.split(':')[0].toLowerCase();
  const parts = host.split('.');
  const last = parts[parts.length - 1];

  // Dev TLD-based naming takes priority
  if (last === 'local' || last === 'localhost') return 'Local';
  if (last === 'test') return 'Test';
  if (last === 'dev') return 'Dev';

  // Subdomain-based naming
  if (parts.length >= 3) {
    const sub = parts[0];
    const mapped = ENV_DETECTION_MAP[sub];
    if (mapped) return mapped;
    return sub.charAt(0).toUpperCase() + sub.slice(1);
  }

  return 'Production';
}

/**
 * Detects open browser tabs related to the active hostname.
 * Groups by shared root project name and excludes already-configured domains.
 * Returns the active hostname first, followed by any related detected hostnames.
 * @param {string} activeHostname
 * @param {string} activeProtocol
 * @param {Array} existingGroups
 * @returns {Promise<Array<{hostname: string, protocol: string, name: string}>>}
 */
export async function detectRelatedTabs(activeHostname, activeProtocol, existingGroups) {
  if (!activeHostname) return [];

  const existingDomains = new Set();
  for (const g of existingGroups) {
    for (const e of g.environments) {
      if (e.domain) existingDomains.add(e.domain.toLowerCase());
    }
  }

  const activeRoot = rootNameFromHostname(activeHostname);
  const seen = new Set();
  const results = [];

  // Always include the active hostname first
  seen.add(activeHostname.toLowerCase());
  results.push({
    hostname: activeHostname,
    protocol: activeProtocol,
    name: envNameFromDetectedHostname(activeHostname),
  });

  let tabs = [];
  try {
    tabs = await chrome.tabs.query({});
  } catch {
    return results;
  }

  for (const tab of tabs) {
    if (!tab.url) continue;
    let url;
    try { url = new URL(tab.url); } catch { continue; }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') continue;
    const h = url.hostname.toLowerCase();
    if (seen.has(h)) continue;
    if (existingDomains.has(h)) continue;
    if (rootNameFromHostname(h) !== activeRoot) continue;
    seen.add(h);
    results.push({
      hostname: h,
      protocol: url.protocol.replace(':', ''),
      name: envNameFromDetectedHostname(h),
    });
  }

  return results;
}

/**
 * Scans open tabs for hostnames related to a given group's environments.
 * Returns suggestions for new environments not yet configured in the group.
 * @param {object} group
 * @returns {Promise<Array<{hostname: string, protocol: string, name: string}>>}
 */
export async function detectSuggestionsForGroup(group) {
  const existingDomains = new Set(
    group.environments.map((e) => (e.domain || '').toLowerCase()).filter(Boolean)
  );

  const groupRoots = new Set(
    group.environments
      .map((e) => (e.domain ? rootNameFromHostname(e.domain) : null))
      .filter(Boolean)
  );

  if (groupRoots.size === 0) return [];

  let tabs = [];
  try { tabs = await chrome.tabs.query({}); } catch { return []; }

  const seen = new Set([...existingDomains]);
  const results = [];

  for (const tab of tabs) {
    if (!tab.url) continue;
    let url;
    try { url = new URL(tab.url); } catch { continue; }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') continue;
    const h = url.hostname.toLowerCase();
    if (seen.has(h)) continue;
    if (!groupRoots.has(rootNameFromHostname(h))) continue;
    seen.add(h);
    results.push({
      hostname: h,
      protocol: url.protocol.replace(':', ''),
      name: envNameFromDetectedHostname(h),
    });
  }

  return results;
}
