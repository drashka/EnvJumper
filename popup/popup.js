// EnvJumper - https://github.com/drashka/EnvJumper
// Copyright (C) 2026 Drashka
// Licence : GPL v3 — voir le fichier LICENSE

import { applyI18n, t } from './modules/i18n.js';
import { migrateData, generateId, getGroups, saveGroups, COLOR_PALETTE } from './modules/helpers/storage.js';
import { initTabs, switchTab, setSettingsRenderer, setEnvironmentsRenderer } from './modules/tabs.js';
import { renderJumperPanel, initJumper } from './modules/jumper/jumper.js';
import { initExportImport } from './modules/settings/import-export.js';
import { el } from './modules/helpers/ui-helpers.js';
import { renderEnvironmentsPanel } from './modules/projects/projects.js';
import { openProjectEdit, initEnvironmentsPanel } from './modules/projects/editing.js';
import { renderSettingsPanel } from './modules/settings/settings.js';

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
 */
function projectNameFromHostname(hostname) {
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
 */
function envNameFromHostname(hostname) {
  const host = hostname.split(':')[0];
  const parts = host.split('.');
  // Only consider the first part if there are at least 2 parts (subdomain present)
  if (parts.length >= 3) {
    const sub = parts[0].toLowerCase();
    return ENV_NAME_MAP[sub] ?? (sub.charAt(0).toUpperCase() + sub.slice(1));
  }
  return 'Production';
}

/**
 * Creates a new project from the active tab URL and opens its edit view.
 */
async function addProjectFromActiveTab() {
  let hostname = '';
  let protocol = 'https';
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      const url = new URL(tab.url);
      hostname = url.hostname;
      protocol = url.protocol.replace(':', '');
    }
  } catch {}

  const groups = await getGroups();
  const envName = hostname ? envNameFromHostname(hostname) : 'Production';
  const projectName = hostname ? projectNameFromHostname(hostname) : t('newGroupName');

  const newGroup = {
    id: generateId(),
    name: projectName,
    isWordPress: false,
    wpLoginPath: '/wp-login.php',
    isWordPressMultisite: false,
    wpNetworkDomain: '',
    wpSites: [],
    links: [],
    environments: hostname ? [{
      id: generateId(),
      name: envName,
      domain: hostname,
      protocol,
      color: COLOR_PALETTE[0].hex,
    }] : [],
  };

  groups.push(newGroup);
  await saveGroups(groups);
  await renderEnvironmentsPanel();
  openProjectEdit(newGroup);
}

// Wire up tab renderer callbacks to avoid circular dependencies
setEnvironmentsRenderer(renderEnvironmentsPanel);
setSettingsRenderer(renderSettingsPanel);

/**
 * Initializes the stealth mode toggle button.
 */
async function initStealthButton() {
  const btn = el('stealth-btn');
  if (!btn) return;

  btn.title = t('stealthModeToggle');

  const initResult = await chrome.storage.local.get(['stealthMode']);
  let stealthMode = !!initResult.stealthMode;

  btn.classList.toggle('active', stealthMode);

  btn.addEventListener('click', async () => {
    const currentResult = await chrome.storage.local.get(['stealthMode']);
    const next = !currentResult.stealthMode;
    await chrome.storage.local.set({ stealthMode: next });
    btn.classList.toggle('active', next);
    btn.title = t('stealthModeToggle');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.id) {
        chrome.tabs.sendMessage(tab.id, { type: 'STEALTH_MODE_CHANGED', stealthMode: next }).catch(() => {});
      }
    } catch {}
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await migrateData();
  applyI18n();
  initTabs();
  initJumper();
  initEnvironmentsPanel({ onBack: renderEnvironmentsPanel });
  initExportImport();
  await initStealthButton();

  // "Add a project" button shown on the Jumper no-match state — smart creation
  el('goto-settings-btn').addEventListener('click', async () => {
    switchTab('environments');
    await addProjectFromActiveTab();
  });

  // "Add project" button in the Environments panel — smart creation from active tab
  el('add-group-btn').addEventListener('click', () => addProjectFromActiveTab());

  await renderJumperPanel();
});
