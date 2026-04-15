// EnvJumper - https://github.com/drashka/EnvJumper
// Copyright (C) 2026 Drashka
// Licence : GPL v3 — voir le fichier LICENSE

import { applyI18n, t } from './modules/i18n.js';
import { generateId, getGroups, getSettings, saveGroups, COLOR_PALETTE } from './modules/helpers/storage.js';
import { initTabs, switchTab, setSettingsRenderer, setEnvironmentsRenderer } from './modules/tabs.js';
import { renderJumperPanel, initJumper, setNoMatchActions } from './modules/jumper/jumper.js';
import { initExportImport } from './modules/settings/import-export.js';
import { el, applyTheme } from './modules/helpers/ui-helpers.js';
import { renderEnvironmentsPanel, setProjectsActions } from './modules/projects/projects.js';
import { openProjectEdit, initEnvironmentsPanel } from './modules/projects/editing.js';
import { renderSettingsPanel } from './modules/settings/settings.js';
import { projectNameFromHostname, envNameFromHostname } from './modules/helpers/hostname.js';
import { detectRelatedTabs } from './modules/helpers/tab-detection.js';

/**
 * Creates a new project from the active tab URL and opens its edit view.
 * Automatically detects related open tabs to pre-fill multiple environments.
 */
async function addProjectFromActiveTab() {
  let activeTabId = null;
  let hostname = '';
  let protocol = 'https';
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      const url = new URL(tab.url);
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        hostname = url.hostname;
        protocol = url.protocol.replace(':', '');
        activeTabId = tab.id;
      }
    }
  } catch {}

  const groups = await getGroups();
  const projectName = hostname ? projectNameFromHostname(hostname) : t('newGroupName');

  // Detect related open tabs to pre-fill multiple environments
  let detectedEnvs = [];
  if (hostname) {
    detectedEnvs = await detectRelatedTabs(hostname, protocol, groups);
  }

  const environments = detectedEnvs.length > 0
    ? detectedEnvs.map((d, i) => ({
        id: generateId(),
        name: d.name,
        domain: d.hostname,
        protocol: d.protocol,
        color: COLOR_PALETTE[i % COLOR_PALETTE.length].hex,
      }))
    : (hostname ? [{
        id: generateId(),
        name: envNameFromHostname(hostname),
        domain: hostname,
        protocol,
        color: COLOR_PALETTE[0].hex,
      }] : []);

  const newGroup = {
    id: generateId(),
    name: projectName,
    cms: 'none',
    cmsAdminPath: '',
    isWordPressMultisite: false,
    wpMultisiteType: 'subdomain',
    wpSites: [],
    links: [],
    environments,
  };

  groups.push(newGroup);
  await saveGroups(groups);
  await renderEnvironmentsPanel();
  await renderJumperPanel();
  openProjectEdit(newGroup);

  // CMS detection runs in background — mutates newGroup (same ref as _editingGroup)
  if (activeTabId) _detectAndApplyCmsInBackground(activeTabId, newGroup);
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

/** Detects CMS on the given tab and applies the result to the group (fire-and-forget). */
async function _detectAndApplyCmsInBackground(tabId, group) {
  try {
    const { detectCmsOnTab, applyDetectionToGroup } = await import('./modules/helpers/cms-detection.js');
    const result = await detectCmsOnTab(tabId);
    if (result) {
      await applyDetectionToGroup(result, group);
      await renderJumperPanel();
    }
  } catch {}
}

// Wire up tab renderer callbacks to avoid circular dependencies
setEnvironmentsRenderer(renderEnvironmentsPanel);
setSettingsRenderer(renderSettingsPanel);

// Wire up onboarding callbacks for the Projects panel
setProjectsActions({
  onCreateProject: () => addEmptyProject(),
  onDetectFromTabs: () => addProjectFromActiveTab(),
});

// Wire up no-match action callbacks for the Jumper panel
setNoMatchActions({
  onNewProject: async () => {
    switchTab('environments');
    await addProjectFromActiveTab();
  },
  onAddToProject: (group) => addEnvToProject(group),
  onSwitchToProjects: () => switchTab('environments'),
  onAddLinkToProject: async (group, path) => {
    const groups = await getGroups();
    const g = groups.find((x) => x.id === group.id);
    if (!g) return;
    if (!g.links) g.links = [];
    const maxOrder = g.links.length > 0 ? Math.max(...g.links.map((l) => l.order || 0)) + 1 : 0;
    const segment = path.split('/').filter(Boolean).pop() || '';
    const label = segment
      ? (segment.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').trim().replace(/^./, (c) => c.toUpperCase()))
      : '';
    const newLink = { id: generateId(), label, path, icon: 'link', order: maxOrder };
    g.links.push(newLink);
    await saveGroups(groups);
    group.links = g.links;

    await renderEnvironmentsPanel();
    switchTab('environments');
    openProjectEdit(group);

    setTimeout(() => {
      document.querySelector('.project-subtab[data-subtab="links"]')?.click();
      setTimeout(() => {
        const rows = document.querySelectorAll('#project-subtab-content .link-settings-row');
        const lastRow = rows[rows.length - 1];
        if (!lastRow) return;
        const labelInput = lastRow.querySelector('input[type="text"]');
        if (labelInput) { labelInput.focus(); labelInput.select(); }
      }, 80);
    }, 80);
  },
});

document.addEventListener('DOMContentLoaded', async () => {
  const settings = await getSettings();
  applyTheme(settings.theme || 'system');

  applyI18n();
  initTabs();
  initJumper();
  initEnvironmentsPanel({ onBack: renderEnvironmentsPanel });
  initExportImport();

  // "Add project" button in the Environments panel — blank project, focus on name
  el('add-group-btn').addEventListener('click', () => addEmptyProject());

  await renderJumperPanel();
});
