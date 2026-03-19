// EnvJumper - https://github.com/drashka/EnvJumper
// Copyright (C) 2026 Drashka
// Licence : GPL v3 — voir le fichier LICENSE

/**
 * Finds the environment matching a given host in the groups.
 * Supports direct domain match and WP Multisite prefix-based subdomains.
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
    }
  }
  return null;
}
