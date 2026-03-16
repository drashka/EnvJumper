// EnvJumper - https://github.com/<votre-repo>/envjump
// Copyright (C) 2026 <Votre Nom>
// Licence : GPL v3 — voir le fichier LICENSE

/**
 * Finds the environment matching a given host in the groups.
 * Supports direct domain match, WP Multisite prefix-based subdomains,
 * and legacy domain-based sites.
 * @param {Array} groups
 * @param {string} host - hostname or hostname:port
 * @returns {{env: object, group: object}|null}
 */
export function findMatch(groups, host) {
  for (const group of groups) {
    for (const env of group.environments) {
      if (env.domain === host) return { env, group };
    }
    if (group.isWordPressMultisite && group.wpSites) {
      const type = group.wpMultisiteType || 'subdomain';
      for (const env of group.environments) {
        for (const site of group.wpSites) {
          const siteHost = type === 'subdirectory'
            ? env.domain
            : (site.prefix ? `${site.prefix}.${env.domain}` : env.domain);
          if (siteHost === host) return { env, group };
        }
      }
      // Legacy: wpSites with domain field at group level
      for (const site of group.wpSites) {
        if (site.domain && site.domain === host) {
          return { env: group.environments[0] || null, group };
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
