// EnvJumper - https://github.com/<votre-repo>/envjump
// Copyright (C) 2026 <Votre Nom>
// Licence : GPL v3 — voir le fichier LICENSE

import { el } from './ui-helpers.js';

/**
 * Callback invoked when the settings tab is activated.
 * Set via setSettingsRenderer() to avoid a circular dependency
 * between tabs.js and settings.js.
 */
let onSettingsTab = () => {};

/**
 * Registers the function to call when the settings tab becomes active.
 * Must be called from popup.js before initTabs().
 * @param {Function} fn
 */
export function setSettingsRenderer(fn) {
  onSettingsTab = fn;
}

/**
 * Attaches click listeners to the tab buttons.
 */
export function initTabs() {
  el('tab-jumper').addEventListener('click', () => switchTab('jumper'));
  el('tab-settings').addEventListener('click', () => switchTab('settings'));
}

/**
 * Switches the visible panel to the one identified by name.
 * @param {'jumper'|'settings'} name
 */
export function switchTab(name) {
  ['jumper', 'settings'].forEach((tab) => {
    el(`tab-${tab}`).classList.toggle('active', tab === name);
    el(`tab-${tab}`).setAttribute('aria-selected', tab === name ? 'true' : 'false');
    el(`panel-${tab}`).classList.toggle('active', tab === name);
    el(`panel-${tab}`).classList.toggle('hidden', tab !== name);
  });
  if (name === 'settings') onSettingsTab();
}
