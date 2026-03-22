// EnvJumper - https://github.com/drashka/EnvJumper
// Copyright (C) 2026 Drashka
// Licence : GPL v3 — voir le fichier LICENSE

import { test, expect } from './fixtures.js';
import { openPopup } from './helpers/extension.js';

/** Opens the Settings tab and waits for its content to be ready. */
async function openSettingsTab(context, extensionId) {
  const popup = await openPopup(context, extensionId);
  await popup.locator('#tab-settings').click();
  // renderSettingsPanel() is async — wait for the first toggle row to appear
  await popup.locator('.toggle-row').first().waitFor({ state: 'visible' });
  return popup;
}

// ── Test 1 : Section "Raccourci clavier" présente dans Paramètres ────────────

test('section Raccourci clavier — présente dans l\'onglet Paramètres', async ({ extContext: context, extensionId }) => {
  const popup = await openSettingsTab(context, extensionId);

  await expect(popup.locator('.keyboard-shortcut-section')).toBeVisible();

  await popup.close();
});

// ── Test 2 : Élément <kbd> affiché dans la section ────────────────────────────

test('section Raccourci clavier — élément <kbd> affiché', async ({ extContext: context, extensionId }) => {
  const popup = await openSettingsTab(context, extensionId);

  const kbd = popup.locator('.keyboard-shortcut-kbd');
  await expect(kbd).toBeVisible();

  // kbd must contain text (either the shortcut like "Alt+J" or the "not set" message)
  const kbdText = await kbd.textContent();
  expect(kbdText?.trim().length).toBeGreaterThan(0);

  await popup.close();
});

// ── Test 3 : Texte d'aide et lien présents ───────────────────────────────────

test('section Raccourci clavier — texte d\'aide et lien "Ouvrir les raccourcis Chrome"', async ({ extContext: context, extensionId }) => {
  const popup = await openSettingsTab(context, extensionId);

  await expect(popup.locator('.keyboard-shortcut-hint')).toBeVisible();
  await expect(popup.locator('.keyboard-shortcut-link')).toBeVisible();

  // Verify the link text is non-empty
  const linkText = await popup.locator('.keyboard-shortcut-link').textContent();
  expect(linkText?.trim().length).toBeGreaterThan(0);

  await popup.close();
});

// ── Test 4 : Titre de la section visible ─────────────────────────────────────

test('section Raccourci clavier — titre de section visible', async ({ extContext: context, extensionId }) => {
  const popup = await openSettingsTab(context, extensionId);

  // The keyboard shortcut section must have a title
  const sectionTitle = popup.locator('.keyboard-shortcut-section .section-title');
  await expect(sectionTitle).toBeVisible();
  const title = await sectionTitle.textContent();
  expect(title?.trim().length).toBeGreaterThan(0);

  await popup.close();
});

// ── Test 5 : Lien "Ouvrir les raccourcis Chrome" déclenche chrome.tabs.create ─

test('lien "Ouvrir les raccourcis Chrome" tente d\'ouvrir la page des raccourcis', async ({ extContext: context, extensionId }) => {
  const popup = await openPopup(context, extensionId);

  // Intercept chrome.tabs.create calls before navigating to settings
  await popup.evaluate(() => {
    window._createdTabs = [];
    const orig = chrome.tabs.create.bind(chrome.tabs);
    chrome.tabs.create = (props) => {
      window._createdTabs.push(props);
      return Promise.resolve({});
    };
  });

  await popup.locator('#tab-settings').click();
  await popup.locator('.toggle-row').first().waitFor({ state: 'visible' });

  // Click the shortcut link
  await popup.locator('.keyboard-shortcut-link').click();

  // chrome.tabs.create should have been called with the Chrome shortcuts URL
  const createdTabs = await popup.evaluate(() => window._createdTabs);
  expect(createdTabs.length).toBeGreaterThan(0);
  expect(createdTabs[0].url).toBe('chrome://extensions/shortcuts');

  await popup.close();
});
