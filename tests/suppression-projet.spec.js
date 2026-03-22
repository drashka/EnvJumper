// EnvJumper - https://github.com/drashka/EnvJumper
// Copyright (C) 2026 Drashka
// Licence : GPL v3 — voir le fichier LICENSE

import { test, expect } from './fixtures.js';
import { openPopup } from './helpers/extension.js';

/** Seeds groups directly into storage. */
async function seedGroups(context, extensionId, groups) {
  const popup = await openPopup(context, extensionId);
  await popup.evaluate((g) => new Promise((resolve) => {
    chrome.storage.local.set({ groups: g }, resolve);
  }), groups);
  await popup.close();
}

const GROUP_A = {
  id: 'group-a',
  name: 'Projet Alpha',
  cms: 'none',
  cmsAdminPath: '',
  isWordPressMultisite: false,
  wpMultisiteType: 'subdomain',
  wpSites: [],
  links: [],
  environments: [
    { id: 'env-a1', name: 'Production', domain: 'alpha.com', protocol: 'https', color: '#EF4444' },
  ],
};

const GROUP_B = {
  id: 'group-b',
  name: 'Projet Beta',
  cms: 'none',
  cmsAdminPath: '',
  isWordPressMultisite: false,
  wpMultisiteType: 'subdomain',
  wpSites: [],
  links: [],
  environments: [
    { id: 'env-b1', name: 'Production', domain: 'beta.com', protocol: 'https', color: '#3B82F6' },
  ],
};

// ── Test 1 : Bouton corbeille visible au hover ────────────────────────────────

test('bouton corbeille présent sur chaque projet dans la liste', async ({ extContext: context, extensionId }) => {
  await seedGroups(context, extensionId, [GROUP_A, GROUP_B]);

  const popup = await openPopup(context, extensionId);
  await popup.locator('#tab-environments').click();

  // Each project row has a trash button
  const items = popup.locator('.project-list-item');
  await expect(items).toHaveCount(2);

  const trashBtns = popup.locator('.project-list-item .project-list-trash');
  await expect(trashBtns).toHaveCount(2);

  await popup.close();
});

// ── Test 2 : Clic corbeille → confirmation → suppression ─────────────────────

test('clic sur la corbeille supprime le projet après confirmation', async ({ extContext: context, extensionId }) => {
  await seedGroups(context, extensionId, [GROUP_A, GROUP_B]);

  const popup = await openPopup(context, extensionId);
  await popup.locator('#tab-environments').click();

  await expect(popup.locator('.project-list-item')).toHaveCount(2);

  // Click trash on first project (Projet Alpha)
  await popup.locator('.project-list-item').first().locator('.project-list-trash').click();

  // Confirmation modal appears
  await expect(popup.locator('#confirm-modal')).toBeVisible();

  // Confirm
  await popup.locator('#confirm-ok').click();

  // One project remaining
  await expect(popup.locator('.project-list-item')).toHaveCount(1);
  await expect(popup.locator('.project-list-item')).toContainText('Projet Beta');

  await popup.close();
});

// ── Test 3 : Annuler la suppression ──────────────────────────────────────────

test('annuler la suppression via la modal ne supprime pas le projet', async ({ extContext: context, extensionId }) => {
  await seedGroups(context, extensionId, [GROUP_A, GROUP_B]);

  const popup = await openPopup(context, extensionId);
  await popup.locator('#tab-environments').click();

  // Click trash
  await popup.locator('.project-list-item').first().locator('.project-list-trash').click();

  // Cancel
  await popup.locator('#confirm-cancel').click();

  // Both projects still present
  await expect(popup.locator('.project-list-item')).toHaveCount(2);

  await popup.close();
});

// ── Test 4 : Clic corbeille n'ouvre pas la vue d'édition ─────────────────────

test('clic sur la corbeille n\'ouvre pas la vue d\'édition du projet', async ({ extContext: context, extensionId }) => {
  await seedGroups(context, extensionId, [GROUP_A]);

  const popup = await openPopup(context, extensionId);
  await popup.locator('#tab-environments').click();

  // Ensure the list view is displayed (not the edit view)
  await expect(popup.locator('.projects-views-row')).not.toHaveClass(/show-edit/);

  // Click trash — this must NOT switch to the edit view
  await popup.locator('.project-list-item').first().locator('.project-list-trash').click();

  // Confirm dialog shows but the edit view is NOT opened
  await expect(popup.locator('#confirm-modal')).toBeVisible();
  await expect(popup.locator('.projects-views-row')).not.toHaveClass(/show-edit/);

  // Close modal
  await popup.locator('#confirm-cancel').click();

  await popup.close();
});

// ── Test 5 : Suppression persistée dans storage ───────────────────────────────

test('suppression persistée — le projet disparaît après rechargement', async ({ extContext: context, extensionId }) => {
  await seedGroups(context, extensionId, [GROUP_A, GROUP_B]);

  const popup = await openPopup(context, extensionId);
  await popup.locator('#tab-environments').click();

  // Delete Projet Alpha
  await popup.locator('.project-list-item').first().locator('.project-list-trash').click();
  await popup.locator('#confirm-ok').click();
  await expect(popup.locator('.project-list-item')).toHaveCount(1);
  await popup.close();

  // Reopen popup and verify persistence
  const popup2 = await openPopup(context, extensionId);
  await popup2.locator('#tab-environments').click();
  await expect(popup2.locator('.project-list-item')).toHaveCount(1);
  await expect(popup2.locator('.project-list-item')).toContainText('Projet Beta');

  await popup2.close();
});

// ── Test 6 : Sous-onglet "Paramètres" absent de la vue édition ───────────────

test('le sous-onglet "Paramètres" n\'existe plus dans la vue d\'édition', async ({ extContext: context, extensionId }) => {
  await seedGroups(context, extensionId, [GROUP_A]);

  const popup = await openPopup(context, extensionId);
  await popup.locator('#tab-environments').click();
  await popup.locator('.project-list-item').first().click();

  // The editing view should be open
  await expect(popup.locator('.projects-view--edit')).toBeVisible();

  // The "Paramètres" sub-tab should not exist
  await expect(popup.locator('.project-subtab[data-subtab="settings"]')).toHaveCount(0);

  // The three remaining sub-tabs should be present
  await expect(popup.locator('.project-subtab[data-subtab="envs"]')).toHaveCount(1);
  await expect(popup.locator('.project-subtab[data-subtab="cms"]')).toHaveCount(1);
  await expect(popup.locator('.project-subtab[data-subtab="links"]')).toHaveCount(1);

  await popup.close();
});
