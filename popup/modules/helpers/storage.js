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
 * Retrieves all groups from chrome.storage.local.
 * @returns {Promise<Array>}
 */
export async function getGroups() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['groups'], (result) => {
      resolve(result.groups || []);
    });
  });
}

/**
 * Persists all groups to chrome.storage.local.
 * @param {Array} groups
 * @returns {Promise<void>}
 */
export async function saveGroups(groups) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ groups }, () => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
      else resolve();
    });
  });
}

/**
 * Retrieves global settings from chrome.storage.sync.
 * Applies defaults for missing fields.
 * @returns {Promise<object>}
 */
export async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['settings'], (result) => {
      const s = result.settings || {};
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

