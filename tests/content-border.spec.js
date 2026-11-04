// EnvJumper - https://github.com/drashka/EnvJumper
// Copyright (C) 2026 Drashka
// Licence : GPL v3 — voir le fichier LICENSE

import { test, expect } from './fixtures.js';
import { openPopup } from './helpers/extension.js';

const GROUPS = [
  {
    id: 'g-border',
    name: 'Projet Bordure',
    cms: 'none',
    links: [],
    environments: [
      {
        id: 'e-staging', name: 'Staging', domain: 'staging.bordure.test', protocol: 'https', color: '#F97316',
        basicAuth: { enabled: true, username: 'user', password: 'secret' },
      },
    ],
  },
];

/** Serves a minimal HTML page for every request to the fake test domains. */
async function routeFakeSites(context) {
  await context.route(/https:\/\/[^/]*\.test\//, (route) => route.fulfill({
    status: 200,
    contentType: 'text/html',
    body: '<!doctype html><html><body><h1>Test</h1></body></html>',
  }));
}

test('bordure et badge affichés sur un domaine configuré', async ({ extContext: context, extensionId }) => {
  const popup = await openPopup(context, extensionId);
  await popup.evaluate((g) => new Promise((r) => chrome.storage.local.set({ groups: g }, r)), GROUPS);
  await routeFakeSites(context);

  const page = await context.newPage();
  await page.goto('https://staging.bordure.test/page');

  const overlay = page.locator('#envjump-overlay');
  await expect(overlay).toBeAttached();
  await expect(overlay).toHaveCSS('border-top-color', 'rgb(249, 115, 22)');
  await expect(overlay).toContainText('Staging');
  await page.close();
});

test('aucune bordure sur un domaine non configuré', async ({ extContext: context, extensionId }) => {
  const popup = await openPopup(context, extensionId);
  await popup.evaluate((g) => new Promise((r) => chrome.storage.local.set({ groups: g }, r)), GROUPS);
  await routeFakeSites(context);

  const page = await context.newPage();
  await page.goto('https://autre.bordure.test/');
  await page.waitForTimeout(500);
  await expect(page.locator('#envjump-overlay')).toHaveCount(0);
  await page.close();
});

test('la bordure se met à jour quand la config change', async ({ extContext: context, extensionId }) => {
  const popup = await openPopup(context, extensionId);
  await popup.evaluate((g) => new Promise((r) => chrome.storage.local.set({ groups: g }, r)), GROUPS);
  await routeFakeSites(context);

  const page = await context.newPage();
  await page.goto('https://staging.bordure.test/');
  await expect(page.locator('#envjump-overlay')).toContainText('Staging');

  const renamed = structuredClone(GROUPS);
  renamed[0].environments[0].name = 'Recette';
  await popup.evaluate((g) => new Promise((r) => chrome.storage.local.set({ groups: g }, r)), renamed);

  await expect(page.locator('#envjump-overlay')).toContainText('Recette');
  await page.close();
});
