// EnvJumper - https://github.com/drashka/EnvJumper
// Copyright (C) 2026 Drashka
// Licence : GPL v3 — voir le fichier LICENSE

import { el } from './helpers/ui-helpers.js';

/**
 * Callback invoked when the environments tab is activated.
 */
let onEnvironmentsTab = () => {};

/**
 * Callback invoked when the settings tab is activated.
 * Set via setSettingsRenderer() to avoid a circular dependency.
 */
let onSettingsTab = () => {};

/**
 * Registers the function to call when the environments tab becomes active.
 * @param {Function} fn
 */
export function setEnvironmentsRenderer(fn) {
  onEnvironmentsTab = fn;
}

/**
 * Registers the function to call when the settings tab becomes active.
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
  el('tab-environments').addEventListener('click', () => switchTab('environments'));
  el('tab-settings').addEventListener('click', () => switchTab('settings'));
}

/**
 * Switches the visible panel to the one identified by name.
 * @param {'jumper'|'environments'|'settings'} name
 */
export function switchTab(name) {
  ['jumper', 'environments', 'settings'].forEach((tab) => {
    el(`tab-${tab}`).classList.toggle('active', tab === name);
    el(`tab-${tab}`).setAttribute('aria-selected', tab === name ? 'true' : 'false');
    el(`panel-${tab}`).classList.toggle('active', tab === name);
    el(`panel-${tab}`).classList.toggle('hidden', tab !== name);
  });
  if (name === 'environments') onEnvironmentsTab();
  if (name === 'settings') onSettingsTab();
}
