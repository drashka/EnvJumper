import { test, expect } from './fixtures.js';
import { openPopup } from './helpers/extension.js';

/** Helper : injecte des groupes directement dans le storage. */
async function seedGroups(context, extensionId, groups) {
  const popup = await openPopup(context, extensionId);
  await popup.evaluate((g) => new Promise((resolve) => {
    chrome.storage.local.set({ groups: g }, resolve);
  }), groups);
  await popup.close();
}

/**
 * Opens the popup and navigates to the Settings tab.
 * Visits Environments first so updateExportGroupSelect() is called and the
 * export <select> is populated with the current groups.
 */
async function openSettingsTab(context, extensionId) {
  const popup = await openPopup(context, extensionId);
  // renderEnvironmentsPanel() calls updateExportGroupSelect(groups), which populates
  // the export group <select>. It must be called before visiting Settings.
  await popup.locator('#tab-environments').click();
  await popup.locator('#tab-settings').click();
  return popup;
}

const GROUP_A = {
  id: 'group-a',
  name: 'Projet Alpha',
  cms: 'none',
  cmsAdminPath: '',
  isWordPressMultisite: false,
  wpMultisiteType: 'subdomain',
  wpSites: [],
  links: [{ id: 'link-1', label: 'Accueil', path: '/', icon: 'link', order: 0 }],
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

const GROUP_WITH_AUTH = {
  id: 'group-auth',
  name: 'Projet Auth',
  cms: 'none',
  cmsAdminPath: '',
  isWordPressMultisite: false,
  wpMultisiteType: 'subdomain',
  wpSites: [],
  links: [],
  environments: [
    {
      id: 'env-auth',
      name: 'Staging',
      domain: 'staging.auth.com',
      protocol: 'https',
      color: '#F97316',
      basicAuth: { enabled: true, username: 'admin', password: 'secret' },
    },
  ],
};

// ── Test 12 : Exporter la config complète ────────────────────────────────────

test('exporter la config complète et vérifier le JSON', async ({ extContext: context, extensionId }) => {
  await seedGroups(context, extensionId, [GROUP_A]);

  const popup = await openSettingsTab(context, extensionId);

  const [download] = await Promise.all([
    popup.waitForEvent('download'),
    popup.locator('#export-all-btn').click(),
  ]);

  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const json = JSON.parse(Buffer.concat(chunks).toString());

  expect(json).toHaveProperty('groups');
  expect(json.groups).toHaveLength(1);
  expect(json.groups[0].name).toBe('Projet Alpha');
  expect(json.groups[0].environments[0].domain).toBe('alpha.com');

  await popup.close();
});

// ── Test 13 : Exporter un seul projet ────────────────────────────────────────

test('exporter un seul projet', async ({ extContext: context, extensionId }) => {
  await seedGroups(context, extensionId, [GROUP_A, GROUP_B]);

  const popup = await openSettingsTab(context, extensionId);

  // Sélectionner "Projet Alpha" dans le select
  await popup.locator('#export-group-select').selectOption({ label: 'Projet Alpha' });

  const [download] = await Promise.all([
    popup.waitForEvent('download'),
    popup.locator('#export-group-btn').click(),
  ]);

  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const json = JSON.parse(Buffer.concat(chunks).toString());

  expect(json.groups).toHaveLength(1);
  expect(json.groups[0].name).toBe('Projet Alpha');

  await popup.close();
});

// ── Test 14 : Importer (remplacement) ────────────────────────────────────────
// Importing 2+ groups triggers the merge/replace modal.

test('importer en mode "Remplacer tout"', async ({ extContext: context, extensionId }) => {
  await seedGroups(context, extensionId, [GROUP_A]);

  // Import 2 groups so the modal appears (1 group is silently merged)
  const importData = JSON.stringify({ groups: [GROUP_B, GROUP_WITH_AUTH] });
  const popup = await openSettingsTab(context, extensionId);

  await popup.locator('#import-file-input').setInputFiles({
    name: 'import.json',
    mimeType: 'application/json',
    buffer: Buffer.from(importData),
  });

  // Choisir "Remplacer tout"
  await popup.locator('#import-replace-btn').click();

  // Wait for the async save + re-render to complete before switching tabs
  await popup.locator('#import-success').waitFor({ state: 'visible' });

  // Aller dans Projets et vérifier : seuls les 2 groupes importés restent
  await popup.locator('#tab-environments').click();
  await expect(popup.locator('.project-list-item')).toHaveCount(2);
  await expect(popup.locator('.project-list-item').nth(0)).toContainText('Projet Beta');
  await expect(popup.locator('.project-list-item').nth(1)).toContainText('Projet Auth');
  await expect(popup.locator('.project-list-item').filter({ hasText: 'Projet Alpha' })).toHaveCount(0);

  await popup.close();
});

// ── Test 15 : Importer (fusion) ───────────────────────────────────────────────
// Importing 2+ groups triggers the merge/replace modal.

test('importer en mode "Fusionner"', async ({ extContext: context, extensionId }) => {
  await seedGroups(context, extensionId, [GROUP_A]);

  // Import 2 groups so the modal appears (1 group is silently merged)
  const importData = JSON.stringify({ groups: [GROUP_B, GROUP_WITH_AUTH] });
  const popup = await openSettingsTab(context, extensionId);

  await popup.locator('#import-file-input').setInputFiles({
    name: 'import.json',
    mimeType: 'application/json',
    buffer: Buffer.from(importData),
  });

  // Choisir "Fusionner"
  await popup.locator('#import-merge-btn').click();

  // Les 3 projets doivent être présents (original + 2 importés)
  await popup.locator('#tab-environments').click();
  await expect(popup.locator('.project-list-item')).toHaveCount(3);
  await expect(popup.locator('.project-list-item').nth(0)).toContainText('Projet Alpha');
  await expect(popup.locator('.project-list-item').nth(1)).toContainText('Projet Beta');
  await expect(popup.locator('.project-list-item').nth(2)).toContainText('Projet Auth');

  await popup.close();
});

// ── Test : Import JSON invalide → message d'erreur ───────────────────────────

test('importer un fichier JSON invalide — affiche un message d\'erreur', async ({ extContext: context, extensionId }) => {
  const popup = await openSettingsTab(context, extensionId);

  await popup.locator('#import-file-input').setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{ this is not valid json }'),
  });

  await expect(popup.locator('#import-error')).toBeVisible();
  await expect(popup.locator('#import-success')).not.toBeVisible();

  await popup.close();
});

// ── Test : Import structure invalide → message d'erreur ──────────────────────

test('importer un JSON avec structure invalide — affiche un message d\'erreur', async ({ extContext: context, extensionId }) => {
  const popup = await openSettingsTab(context, extensionId);

  await popup.locator('#import-file-input').setInputFiles({
    name: 'invalid-structure.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ notGroups: [] })),
  });

  await expect(popup.locator('#import-error')).toBeVisible();
  await expect(popup.locator('#import-success')).not.toBeVisible();

  await popup.close();
});

// ── Test : Export avec Basic Auth inclus ─────────────────────────────────────

test('exporter avec Basic Auth inclus — les credentials sont dans le JSON', async ({ extContext: context, extensionId }) => {
  await seedGroups(context, extensionId, [GROUP_WITH_AUTH]);

  const popup = await openSettingsTab(context, extensionId);

  // Checkbox is checked by default
  await expect(popup.locator('#export-basicauth-check')).toBeChecked();

  const [download] = await Promise.all([
    popup.waitForEvent('download'),
    popup.locator('#export-all-btn').click(),
  ]);

  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const json = JSON.parse(Buffer.concat(chunks).toString());

  const env = json.groups[0].environments[0];
  expect(env.basicAuth).toBeDefined();
  expect(env.basicAuth.username).toBe('admin');
  expect(env.basicAuth.password).toBe('secret');

  await popup.close();
});

// ── Test : Export sans Basic Auth ─────────────────────────────────────────────

test('exporter sans Basic Auth — les credentials sont absents du JSON', async ({ extContext: context, extensionId }) => {
  await seedGroups(context, extensionId, [GROUP_WITH_AUTH]);

  const popup = await openSettingsTab(context, extensionId);

  // Uncheck the Basic Auth checkbox
  await popup.locator('#export-basicauth-check').click();
  await expect(popup.locator('#export-basicauth-check')).not.toBeChecked();

  const [download] = await Promise.all([
    popup.waitForEvent('download'),
    popup.locator('#export-all-btn').click(),
  ]);

  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const json = JSON.parse(Buffer.concat(chunks).toString());

  const env = json.groups[0].environments[0];
  expect(env.basicAuth).toBeUndefined();

  await popup.close();
});

// ── Test 20 : Import d'un seul groupe — ajout silencieux ─────────────────────

test('importer un seul groupe — ajout silencieux sans modal', async ({ extContext: context, extensionId }) => {
  await seedGroups(context, extensionId, [GROUP_A]);

  const popup = await openSettingsTab(context, extensionId);

  await popup.locator('#import-file-input').setInputFiles({
    name: 'single.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ groups: [GROUP_B] })),
  });

  // Modal should NOT appear for a single-group import
  await expect(popup.locator('#import-modal')).not.toBeVisible();

  // Success message appears
  await expect(popup.locator('#import-success')).toBeVisible();

  // Environments tab now shows 2 projects
  await popup.locator('#tab-environments').click();
  await expect(popup.locator('.project-list-item')).toHaveCount(2);
  await expect(popup.locator('.project-list-item').nth(0)).toContainText('Projet Alpha');
  await expect(popup.locator('.project-list-item').nth(1)).toContainText('Projet Beta');

  await popup.close();
});
