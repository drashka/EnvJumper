// EnvJumper - https://github.com/<votre-repo>/envjump
// Copyright (C) 2026 <Votre Nom>
// Licence : GPL v3 — voir le fichier LICENSE

import { applyI18n, t } from './modules/i18n.js';
import { migrateData, generateId, getGroups, saveGroups } from './modules/helpers/storage.js';
import { initTabs, switchTab, setSettingsRenderer, setEnvironmentsRenderer } from './modules/tabs.js';
import { renderJumperPanel, initJumper } from './modules/jumper/jumper.js';
import { initExportImport } from './modules/settings/import-export.js';
import { el } from './modules/helpers/ui-helpers.js';
import { renderEnvironmentsPanel } from './modules/projects/projects.js';
import { openProjectEdit, initEnvironmentsPanel } from './modules/projects/editing.js';
import { renderSettingsPanel } from './modules/settings/settings.js';

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

  // "Go to environments" button shown on the empty Jumper state
  el('goto-settings-btn').addEventListener('click', () => switchTab('environments'));

  // "Add group" button in the Environments panel
  el('add-group-btn').addEventListener('click', async () => {
    const groups = await getGroups();
    const newGroup = {
      id: generateId(),
      name: t('newGroupName'),
      isWordPress: false,
      wpLoginPath: '/wp-login.php',
      isWordPressMultisite: false,
      wpNetworkDomain: '',
      wpSites: [],
      links: [],
      environments: [],
    };
    groups.push(newGroup);
    await saveGroups(groups);
    await renderEnvironmentsPanel();
    openProjectEdit(newGroup);
  });

  await renderJumperPanel();
});
