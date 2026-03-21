// EnvJumper - https://github.com/drashka/EnvJumper
// Copyright (C) 2026 Drashka
// Licence : GPL v3 — voir le fichier LICENSE

// Common subdomains to strip when generating a project name
const IGNORED_SUBDOMAINS = new Set(['www', 'staging', 'dev', 'preprod', 'test', 'local', 'admin', 'develop', 'qa', 'recette', 'fr', 'en', 'de', 'es', 'it', 'nl', 'pt', 'ru', 'zh', 'ar']);

// Subdomain → environment name mapping
const ENV_NAME_MAP = {
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
 * Derives a project name from a hostname.
 * e.g. "staging.mon-super_site.com" → "Mon Super Site"
 * @param {string} hostname
 * @returns {string}
 */
export function projectNameFromHostname(hostname) {
  // Remove port if any
  const host = hostname.split(':')[0];
  const parts = host.split('.');
  // Remove TLD (last part) and common subdomains
  const filtered = parts.filter((p, i) => {
    if (i === parts.length - 1) return false; // TLD
    if (IGNORED_SUBDOMAINS.has(p.toLowerCase())) return false;
    return true;
  });
  if (filtered.length === 0) return host;
  return filtered
    .join(' ')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Derives an environment name from the first subdomain.
 * e.g. "staging.xxx" → "Staging", "www.xxx" / "xxx.com" → "Production"
 * @param {string} hostname
 * @returns {string}
 */
export function envNameFromHostname(hostname) {
  const host = hostname.split(':')[0];
  const parts = host.split('.');
  // Only consider the first part if there are at least 2 parts (subdomain present)
  if (parts.length >= 3) {
    const sub = parts[0].toLowerCase();
    return ENV_NAME_MAP[sub] ?? (sub.charAt(0).toUpperCase() + sub.slice(1));
  }
  return 'Production';
}
