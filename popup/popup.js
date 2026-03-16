// EnvJumper - https://github.com/drashka/EnvJumper
// Copyright (C) 2026 Drashka
// Licence : GPL v3 — voir le fichier LICENSE

import { applyI18n, t } from './modules/i18n.js';
import { generateId, getGroups, saveGroups, COLOR_PALETTE } from './modules/helpers/storage.js';
import { initTabs, switchTab, setSettingsRenderer, setEnvironmentsRenderer } from './modules/tabs.js';
import { renderJumperPanel, initJumper, setNoMatchActions } from './modules/jumper/jumper.js';
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
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        hostname = url.hostname;
        protocol = url.protocol.replace(':', '');
      }
    }
  } catch {}

  const groups = await getGroups();
  const envName = hostname ? envNameFromHostname(hostname) : 'Production';
  const projectName = hostname ? projectNameFromHostname(hostname) : t('newGroupName');

  const newGroup = {
    id: generateId(),
    name: projectName,
    cms: 'none',
    cmsAdminPath: '',
    isWordPressMultisite: false,
    wpMultisiteType: 'subdomain',
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

/**
 * Creates a new environment in an existing group using the active tab's URL,
 * then switches to the Environments tab and opens the project edit view.
 * @param {object} group - The target group
 */
async function addEnvToProject(group) {
  let hostname = '';
  let protocol = 'https';
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      const url = new URL(tab.url);
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        hostname = url.hostname;
        protocol = url.protocol.replace(':', '');
      }
    }
  } catch {}

  const envName = hostname ? envNameFromHostname(hostname) : 'Production';
  const newEnv = { id: generateId(), name: envName, domain: hostname, protocol, color: COLOR_PALETTE[0].hex };

  const groups = await getGroups();
  const g = groups.find((x) => x.id === group.id);
  if (!g) return;
  g.environments.push(newEnv);
  await saveGroups(groups);
  group.environments = g.environments;

  await renderEnvironmentsPanel();
  switchTab('environments');
  openProjectEdit(group);

  // Expand the new env card and focus its name input after DOM renders
  setTimeout(() => {
    const cards = document.querySelectorAll('#project-subtab-content .env-card');
    const lastCard = cards[cards.length - 1];
    if (!lastCard) return;
    const body = lastCard.querySelector('.env-card-body');
    if (body && body.style.display === 'none') lastCard.querySelector('.env-card-header')?.click();
    setTimeout(() => lastCard.querySelector('input[type="text"]')?.focus(), 80);
  }, 80);
}

/**
 * Creates a blank project with one empty environment and opens its edit view,
 * focusing the project name input.
 */
async function addEmptyProject() {
  const groups = await getGroups();

  const newGroup = {
    id: generateId(),
    name: '',
    cms: 'none',
    cmsAdminPath: '',
    isWordPressMultisite: false,
    wpMultisiteType: 'subdomain',
    wpSites: [],
    links: [],
    environments: [{
      id: generateId(),
      name: '',
      domain: '',
      protocol: 'https',
      color: COLOR_PALETTE[0].hex,
    }],
  };

  groups.push(newGroup);
  await saveGroups(groups);
  await renderEnvironmentsPanel();
  openProjectEdit(newGroup);

  // Focus the project name input after the slide-in animation starts
  setTimeout(() => el('project-edit-name-input')?.focus(), 50);
}

// Wire up tab renderer callbacks to avoid circular dependencies
setEnvironmentsRenderer(renderEnvironmentsPanel);
setSettingsRenderer(renderSettingsPanel);

// Wire up no-match action callbacks for the Jumper panel
setNoMatchActions({
  onNewProject: async () => {
    switchTab('environments');
    await addProjectFromActiveTab();
  },
  onAddToProject: (group) => addEnvToProject(group),
});

document.addEventListener('DOMContentLoaded', async () => {
  applyI18n();
  initTabs();
  initJumper();
  initEnvironmentsPanel({ onBack: renderEnvironmentsPanel });
  initExportImport();

  // "Add project" button in the Environments panel — blank project, focus on name
  el('add-group-btn').addEventListener('click', () => addEmptyProject());

  await renderJumperPanel();
});
