// EnvJumper - https://github.com/drashka/EnvJumper
// Copyright (C) 2026 Drashka
// Licence : GPL v3 — voir le fichier LICENSE

/**
 * Color palette available for environments (6 colors).
 * Each entry has a name and a hex value.
 */
export const COLOR_PALETTE = [
  { name: 'Rouge',  hex: '#EF4444' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Vert',   hex: '#10B981' },
  { name: 'Bleu',   hex: '#3B82F6' },
  { name: 'Violet', hex: '#8B5CF6' },
  { name: 'Gris',   hex: '#6B7280' },
];

/**
 * Generates a random UUID v4.
 * @returns {string}
 */
export function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/**
 * Retrieves all groups from chrome.storage.sync.
 * @returns {Promise<Array>}
 */
export async function getGroups() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['groups'], (result) => resolve(result.groups || []));
  });
}

/**
 * Persists all groups to chrome.storage.sync.
 * @param {Array} groups
 * @returns {Promise<void>}
 */
export async function saveGroups(groups) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set({ groups }, () => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
      else resolve();
    });
  });
}

/**
 * Retrieves global settings from chrome.storage.sync.
 * Applies defaults and migrates legacy badgePosition → labelPosition.
 * @returns {Promise<object>}
 */
export async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['settings'], (result) => {
      const s = result.settings || {};
      // Migration: badgePosition → labelPosition
      if (s.badgePosition !== undefined && s.labelPosition === undefined) {
        s.labelPosition = s.badgePosition;
        delete s.badgePosition;
        chrome.storage.sync.set({ settings: s });
      }
      resolve({
        showFrame: true,
        showLabel: true,
        labelPosition: 'top-left',
        labelSize: 'm',
        ...s,
      });
    });
  });
}

/**
 * Persists global settings to chrome.storage.sync.
 * @param {object} settings
 * @returns {Promise<void>}
 */
export async function saveSettings(settings) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set({ settings }, () => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
      else resolve();
    });
  });
}

/**
 * Migrates data from the old format (WP/links at env level)
 * to the new format (WP/links at group level).
 * Also ensures every group has all expected fields.
 */
export async function migrateData() {
  const groups = await getGroups();
  let dirty = false;

  for (const group of groups) {
    // Ensure group fields exist
    if (group.isWordPressMultisite === undefined) { group.isWordPressMultisite = false; dirty = true; }
    if (!group.wpSites) { group.wpSites = []; dirty = true; }
    if (!group.links) {
      // Pull links from the first env that has some
      const envWithLinks = group.environments.find((e) => e.links && e.links.length > 0);
      group.links = envWithLinks ? envWithLinks.links : [];
      dirty = true;
    }

    // Migrate isWordPress → cms
    if (group.isWordPress !== undefined && group.cms === undefined) {
      group.cms = group.isWordPress ? 'wordpress' : 'none';
      delete group.isWordPress;
      dirty = true;
    }
    // Migrate wpLoginPath → cmsLoginPath
    if (group.wpLoginPath !== undefined && group.cmsLoginPath === undefined) {
      group.cmsLoginPath = group.wpLoginPath;
      delete group.wpLoginPath;
      dirty = true;
    }
    // Ensure cms is defined
    if (group.cms === undefined) { group.cms = 'none'; dirty = true; }
    // Ensure cmsAdminPath is defined (don't mark dirty)
    if (!group.cmsAdminPath) { group.cmsAdminPath = ''; }
    // Migrate link type: 'wordpress' → 'cms'
    if (group.links) {
      for (const link of group.links) {
        if (link.type === 'wordpress') { link.type = 'cms'; dirty = true; }
        // Migrate iconKey → icon
        if (link.iconKey !== undefined && link.icon === undefined) {
          link.icon = link.iconKey; dirty = true;
          delete link.iconKey;
        }
      }
    }

    if (group.cms === 'none') {
      // Pull isWordPress from the first env that has it (legacy path: env-level WP fields)
      const envWithWp = group.environments.find((e) => e.isWordPress);
      if (envWithWp) {
        group.cms = 'wordpress';
        group.cmsLoginPath = group.cmsLoginPath || envWithWp.wpLoginPath || '/wp-login.php';
        group.isWordPressMultisite = envWithWp.isWordPressMultisite || false;
        group.wpNetworkDomain = envWithWp.wpNetworkDomain || '';
        group.wpSites = envWithWp.wpSites || [];
        dirty = true;
      }
    }

    // Migrate old WP Multisite format: wpNetworkDomain + wpSites[{label, domain}]
    // → new format: wpSites[{label, prefix}] + wpMultisiteType
    if (group.isWordPressMultisite) {
      if (group.wpNetworkDomain && group.wpSites && group.wpSites.length > 0
          && group.wpSites[0].domain !== undefined && group.wpSites[0].prefix === undefined) {
        // Convert domain-based sites to prefix-based
        const networkDomain = group.wpNetworkDomain;
        group.wpSites = group.wpSites.map((site) => {
          let prefix;
          if (site.domain === networkDomain) {
            prefix = '';
          } else {
            prefix = site.domain.replace(`.${networkDomain}`, '');
          }
          return { label: site.label, prefix };
        });
        if (!group.wpMultisiteType) group.wpMultisiteType = 'subdomain';
        delete group.wpNetworkDomain;
        dirty = true;
      } else if (group.wpSites && group.wpSites.length > 0
                 && group.wpSites[0].domain !== undefined && group.wpSites[0].prefix === undefined) {
        // wpSites with domain but no prefix and no wpNetworkDomain — set prefix to ""
        group.wpSites = group.wpSites.map((site) => ({ label: site.label, prefix: '' }));
        dirty = true;
      }
      // Ensure wpMultisiteType is defined
      if (!group.wpMultisiteType) { group.wpMultisiteType = 'subdomain'; dirty = true; }
    }

    // Migrate link labels stored as raw i18n keys (e.g. "wpLinkPermalinks" → translated string)
    if (group.links && group.links.length > 0) {
      const I18N_LINK_KEYS = [
        'wpLinkLogin', 'wpLinkDashboard', 'wpLinkPosts', 'wpLinkPages',
        'wpLinkMedia', 'wpLinkPlugins', 'wpLinkAppearance', 'wpLinkSettings', 'wpLinkPermalinks',
        'cmsLinkLogin', 'cmsLinkDashboard', 'cmsLinkMedia', 'cmsLinkUsers',
        'cmsLinkConfiguration', 'cmsLinkSettings', 'cmsLinkModules', 'cmsLinkCategories',
        'cmsLinkExtensions', 'cmsLinkContent', 'cmsLinkArticles', 'cmsLinkStructure',
        'cmsLinkPeople', 'cmsLinkReports', 'cmsLinkOrders', 'cmsLinkCatalog',
        'cmsLinkCustomers', 'cmsLinkDesign', 'cmsLinkProducts', 'cmsLinkThemes',
        'cmsLinkApps', 'cmsLinkSystem', 'cmsLinkAdmin', 'cmsLinkAdministration',
      ];
      for (const link of group.links) {
        if (I18N_LINK_KEYS.includes(link.label)) {
          const translated = chrome.i18n.getMessage(link.label);
          if (translated) { link.label = translated; dirty = true; }
        }
      }
    }

    // Clean up envs: remove fields that now belong at the group level
    // Also ensure each env has a protocol field (default: 'https')
    for (const env of group.environments) {
      const hadExtra = env.isWordPress !== undefined || env.links !== undefined;
      delete env.isWordPress;
      delete env.wpLoginPath;
      delete env.isWordPressMultisite;
      delete env.wpNetworkDomain;
      delete env.wpSites;
      delete env.links;
      if (hadExtra) dirty = true;
      // Add default protocol if missing
      if (env.protocol === undefined) { env.protocol = 'https'; dirty = true; }
    }
  }

  if (dirty) await saveGroups(groups);
}
