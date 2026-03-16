// EnvJump - https://github.com/<votre-repo>/envjump
// Copyright (C) 2026 <Votre Nom>
// Licence : GPL v3 — voir le fichier LICENSE

import { getGroups, saveGroups, getSettings, saveSettings, generateId } from './storage.js';
import { t } from './i18n.js';
import { el, hide, showImportError, showImportSuccess, showImportModal } from './ui-helpers.js';
import { renderSettingsPanel } from './settings.js';

/**
 * Triggers a JSON file download in the browser.
 * @param {object} data - Data to serialize
 * @param {string} filename - Download filename
 */
function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Converts a JSON export from the old format (WP/links at env level, or
 * WP Multisite at group level) to the current format (WP/links at group level).
 * @param {object} data - Parsed import JSON
 * @returns {object} Converted data
 */
function convertOldFormat(data) {
  if (!data || !Array.isArray(data.groups)) return data;

  const groups = data.groups.map((group) => {
    const newGroup = { ...group };

    // Lift WP/links from envs if not already at group level
    if (newGroup.isWordPress === undefined && newGroup.cms === undefined && newGroup.environments) {
      const envWithWp = newGroup.environments.find((e) => e.isWordPress);
      if (envWithWp) {
        newGroup.isWordPress = true;
        newGroup.wpLoginPath = envWithWp.wpLoginPath || '/wp-login.php';
        newGroup.isWordPressMultisite = envWithWp.isWordPressMultisite || false;
        newGroup.wpNetworkDomain = envWithWp.wpNetworkDomain || '';
        newGroup.wpSites = envWithWp.wpSites || [];
      }
    }
    if (!newGroup.links && newGroup.environments) {
      const envWithLinks = newGroup.environments.find((e) => e.links && e.links.length > 0);
      newGroup.links = envWithLinks ? envWithLinks.links : [];
    }

    // Migration: isWordPress → cms
    if (newGroup.isWordPress !== undefined && newGroup.cms === undefined) {
      newGroup.cms = newGroup.isWordPress ? 'wordpress' : 'none';
      delete newGroup.isWordPress;
    }
    // Migration: wpLoginPath → cmsLoginPath
    if (newGroup.wpLoginPath !== undefined) {
      newGroup.cmsLoginPath = newGroup.cmsLoginPath || newGroup.wpLoginPath;
      delete newGroup.wpLoginPath;
    }
    // Ensure cms is defined
    if (!newGroup.cms) newGroup.cms = 'none';

    // Migration: old format "WP Multisite at group level" (before env format)
    if (newGroup.cms !== 'wordpress' && newGroup.isWordPressMultisite) {
      newGroup.cms = 'wordpress';
    }

    // Migrate link types and icon keys
    if (Array.isArray(newGroup.links)) {
      newGroup.links = newGroup.links.map((link) => {
        const l = { ...link };
        if (l.type === 'wordpress') l.type = 'cms';
        if (l.iconKey !== undefined && l.icon === undefined) {
          l.icon = l.iconKey;
          delete l.iconKey;
        }
        return l;
      });
    }

    // Migration: old WP Multisite format wpNetworkDomain + wpSites[{label, domain}]
    // → new format: wpSites[{label, prefix}] + wpMultisiteType
    if (newGroup.isWordPressMultisite && newGroup.wpNetworkDomain
        && Array.isArray(newGroup.wpSites) && newGroup.wpSites.length > 0
        && newGroup.wpSites[0].domain !== undefined && newGroup.wpSites[0].prefix === undefined) {
      const networkDomain = newGroup.wpNetworkDomain;
      newGroup.wpSites = newGroup.wpSites.map((site) => {
        let prefix;
        if (site.domain === networkDomain) {
          prefix = '';
        } else {
          prefix = site.domain.replace(`.${networkDomain}`, '');
        }
        return { label: site.label, prefix };
      });
      if (!newGroup.wpMultisiteType) newGroup.wpMultisiteType = 'subdomain';
      delete newGroup.wpNetworkDomain;
    } else if (newGroup.isWordPressMultisite && Array.isArray(newGroup.wpSites)
               && newGroup.wpSites.length > 0 && newGroup.wpSites[0].domain !== undefined
               && newGroup.wpSites[0].prefix === undefined) {
      // wpSites with domain but no prefix — set prefix to ""
      newGroup.wpSites = newGroup.wpSites.map((site) => ({ label: site.label, prefix: '' }));
    }
    // Ensure wpMultisiteType is set when multisite is enabled
    if (newGroup.isWordPressMultisite && !newGroup.wpMultisiteType) {
      newGroup.wpMultisiteType = 'subdomain';
    }

    // Group defaults
    newGroup.cms = newGroup.cms || 'none';
    newGroup.cmsLoginPath = newGroup.cmsLoginPath || '/';
    newGroup.cmsAdminPath = newGroup.cmsAdminPath || '';
    newGroup.isWordPressMultisite = newGroup.isWordPressMultisite || false;
    newGroup.wpSites = newGroup.wpSites || [];
    newGroup.links = newGroup.links || [];

    // Clean up envs: keep only id, name, domain, color
    newGroup.environments = (newGroup.environments || []).map((env) => ({
      id: env.id || generateId(),
      name: env.name || '',
      domain: env.domain || '',
      color: env.color || '#6B7280',
    }));

    return newGroup;
  });

  return { ...data, groups };
}

/**
 * Validates the structure of the imported JSON (new format).
 * @param {object} data
 * @returns {boolean}
 */
function validateImportData(data) {
  if (!data || typeof data !== 'object') return false;
  if (!Array.isArray(data.groups)) return false;
  for (const g of data.groups) {
    if (!g.name || !Array.isArray(g.environments)) return false;
    for (const e of g.environments) {
      if (!e.name || !e.domain || !e.color) return false;
    }
  }
  return true;
}

/**
 * Attaches all export and import event listeners.
 * Must be called once during DOMContentLoaded.
 */
export function initExportImport() {
  // Export all (includes global settings)
  el('export-all-btn').addEventListener('click', async () => {
    const [groups, settings] = await Promise.all([getGroups(), getSettings()]);
    downloadJson({ groups, settings }, 'envjump-export.json');
  });

  // Export a single group
  el('export-group-btn').addEventListener('click', async () => {
    const groupId = el('export-group-select').value;
    if (!groupId) return;
    const groups = await getGroups();
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    const filename = `envjump-${group.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    downloadJson({ groups: [group] }, filename);
  });

  // Import from file
  el('import-file-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    hide('import-error');
    hide('import-success');

    let data;
    try {
      const text = await file.text();
      data = JSON.parse(text);
    } catch {
      showImportError(t('importErrorInvalidJson'));
      e.target.value = '';
      return;
    }

    // Convert old format if necessary
    data = convertOldFormat(data);

    if (!validateImportData(data)) {
      showImportError(t('importErrorInvalidStructure'));
      e.target.value = '';
      return;
    }

    const importedGroups = data.groups;
    e.target.value = '';

    // Import global settings if present
    if (data.settings) {
      const currentSettings = await getSettings();
      await saveSettings({ ...currentSettings, ...data.settings });
    }

    if (importedGroups.length === 1) {
      // Single group: add directly
      const groups = await getGroups();
      groups.push({ ...importedGroups[0], id: generateId() });
      await saveGroups(groups);
      await renderSettingsPanel();
      showImportSuccess(t('importSuccessGroup', importedGroups[0].name));
    } else {
      // Multiple groups: ask the user whether to merge or replace
      const choice = await showImportModal();

      if (choice === 'merge') {
        const groups = await getGroups();
        const merged = [...groups, ...importedGroups.map((g) => ({ ...g, id: generateId() }))];
        await saveGroups(merged);
        await renderSettingsPanel();
        showImportSuccess(t('importSuccessMerge', String(importedGroups.length)));
      } else {
        // replace
        const newGroups = importedGroups.map((g) => ({ ...g, id: generateId() }));
        await saveGroups(newGroups);
        await renderSettingsPanel();
        showImportSuccess(t('importSuccessReplace', String(newGroups.length)));
      }
    }
  });
}
