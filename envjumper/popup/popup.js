// EnvJump - https://github.com/<votre-repo>/envjump
// Copyright (C) 2026 <Votre Nom>
// Licence : GPL v3 — voir le fichier LICENSE

import { applyI18n, t } from './modules/i18n.js';
import { migrateData, generateId, getGroups, saveGroups } from './modules/storage.js';
import { initTabs, switchTab, setSettingsRenderer } from './modules/tabs.js';
import { renderJumperPanel } from './modules/jumper.js';
import { initExportImport } from './modules/import-export.js';
import { el } from './modules/ui-helpers.js';
import { renderSettingsPanel } from './modules/settings.js';

// Wire up the settings renderer callback to avoid a circular dependency
// between tabs.js and settings.js.
setSettingsRenderer(renderSettingsPanel);

document.addEventListener('DOMContentLoaded', async () => {
  await migrateData();
  applyI18n();
  initTabs();
  initExportImport();

  // "Go to settings" button shown on the empty Jumper state
  el('goto-settings-btn').addEventListener('click', () => switchTab('settings'));

  // "Add group" button in the Settings panel
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
    await renderSettingsPanel();
    // Open and scroll to the newly added group card
    const cards = el('groups-list').querySelectorAll('.group-card');
    if (cards.length > 0) {
      const lastCard = cards[cards.length - 1];
      lastCard.classList.add('open');
      lastCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      const nameInput = lastCard.querySelector('.group-name-input');
      if (nameInput) { nameInput.focus(); nameInput.select(); }
    }
  });

  await renderJumperPanel();
});
