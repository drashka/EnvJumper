// EnvJump - https://github.com/<votre-repo>/envjump
// Copyright (C) 2026 <Votre Nom>
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
 * @returns {Promise<object>}
 */
export async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['settings'], (result) => {
      resolve(result.settings || { badgePosition: 'top-left' });
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
    if (group.isWordPress === undefined) { group.isWordPress = false; dirty = true; }
    if (!group.wpLoginPath) { group.wpLoginPath = '/wp-login.php'; dirty = true; }
    if (group.isWordPressMultisite === undefined) { group.isWordPressMultisite = false; dirty = true; }
    if (!group.wpNetworkDomain) { group.wpNetworkDomain = ''; }
    if (!group.wpSites) { group.wpSites = []; dirty = true; }
    if (!group.links) {
      // Pull links from the first env that has some
      const envWithLinks = group.environments.find((e) => e.links && e.links.length > 0);
      group.links = envWithLinks ? envWithLinks.links : [];
      dirty = true;
    }
    if (!group.isWordPress) {
      // Pull isWordPress from the first env that has it
      const envWithWp = group.environments.find((e) => e.isWordPress);
      if (envWithWp) {
        group.isWordPress = true;
        group.wpLoginPath = envWithWp.wpLoginPath || '/wp-login.php';
        group.isWordPressMultisite = envWithWp.isWordPressMultisite || false;
        group.wpNetworkDomain = envWithWp.wpNetworkDomain || '';
        group.wpSites = envWithWp.wpSites || [];
        dirty = true;
      }
    }

    // Clean up envs: remove fields that now belong at the group level
    for (const env of group.environments) {
      const hadExtra = env.isWordPress !== undefined || env.links !== undefined;
      delete env.isWordPress;
      delete env.wpLoginPath;
      delete env.isWordPressMultisite;
      delete env.wpNetworkDomain;
      delete env.wpSites;
      delete env.links;
      if (hadExtra) dirty = true;
    }
  }

  if (dirty) await saveGroups(groups);
}
