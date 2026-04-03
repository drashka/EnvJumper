// EnvJumper - https://github.com/drashka/EnvJumper
// Copyright (C) 2026 Drashka
// Licence : GPL v3 — voir le fichier LICENSE

/**
 * Captures screenshots of the real extension popup in various states.
 * Output: screenshots/output/extension/*.png
 *
 * Usage: node screenshots/capture-extension.js
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';
import os from 'os';
import { mkdirSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXTENSION_PATH = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(__dirname, 'output', 'extension');

// Realistic seed data for screenshots
const SEED_GROUPS = [
  {
    id: 'g-alpha',
    name: 'Mon Projet Client',
    cms: 'wordpress',
    cmsAdminPath: '',
    isWordPressMultisite: false,
    wpMultisiteType: 'subdomain',
    wpSites: [],
    links: [
      { id: 'l-1', label: 'Connexion', path: '/wp-login.php', icon: 'log-in', cmsLinkId: 'login', order: 0 },
      { id: 'l-2', label: 'Tableau de bord', path: '/wp-admin/', icon: 'layout-dashboard', cmsLinkId: 'dashboard', order: 1 },
      { id: 'l-3', label: 'Articles', path: '/wp-admin/edit.php', icon: 'file-text', cmsLinkId: 'posts', order: 2 },
      { id: 'l-4', label: 'Médias', path: '/wp-admin/upload.php', icon: 'image', cmsLinkId: 'media', order: 3 },
    ],
    environments: [
      { id: 'e-1', name: 'Production', domain: 'monprojet.fr', protocol: 'https', color: '#EF4444' },
      { id: 'e-2', name: 'Staging', domain: 'staging.monprojet.fr', protocol: 'https', color: '#F97316' },
      { id: 'e-3', name: 'Local', domain: 'monprojet.local', protocol: 'http', color: '#10B981' },
    ],
  },
  {
    id: 'g-beta',
    name: 'Boutique E-commerce',
    cms: 'prestashop',
    cmsAdminPath: '/admin-dev',
    isWordPressMultisite: false,
    wpMultisiteType: 'subdomain',
    wpSites: [],
    links: [
      { id: 'l-5', label: 'Connexion', path: '/admin-dev/index.php?controller=AdminLogin', icon: 'log-in', cmsLinkId: 'login', order: 0 },
      { id: 'l-6', label: 'Tableau de bord', path: '/admin-dev/', icon: 'layout-dashboard', cmsLinkId: 'dashboard', order: 1 },
    ],
    environments: [
      { id: 'e-4', name: 'Production', domain: 'boutique.com', protocol: 'https', color: '#3B82F6' },
      { id: 'e-5', name: 'Dev', domain: 'dev.boutique.com', protocol: 'https', color: '#8B5CF6', basicAuth: { enabled: true, username: 'dev', password: 'secret' } },
    ],
  },
  {
    id: 'g-gamma',
    name: 'Site Institutionnel',
    cms: 'none',
    cmsAdminPath: '',
    isWordPressMultisite: false,
    wpMultisiteType: 'subdomain',
    wpSites: [],
    links: [
      { id: 'l-7', label: 'Accueil', path: '/', icon: 'globe', order: 0 },
    ],
    environments: [
      { id: 'e-6', name: 'Production', domain: 'institution.org', protocol: 'https', color: '#6B7280' },
    ],
  },
];

function pause(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function launchExtension() {
  const userDataDir = path.join(os.tmpdir(), `pw-ext-screenshots-${Date.now()}`);

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    locale: 'fr-FR',
    colorScheme: 'light',
    // Match the popup's intrinsic width so the capture is pixel-accurate
    viewport: { width: 510, height: 600 },
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      '--no-first-run',
      '--disable-default-apps',
      '--lang=fr-FR',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-sandbox',
    ],
  });

  const serviceWorker = context.serviceWorkers()[0]
    || await context.waitForEvent('serviceworker');
  const extensionId = serviceWorker.url().split('/')[2];

  return { context, extensionId };
}

async function seedStorage(context, groups) {
  const sw = context.serviceWorkers()[0];
  await sw.evaluate((g) => new Promise((resolve) => {
    chrome.storage.local.set({ groups: g }, resolve);
  }), groups);
}

/**
 * Opens the popup with a mocked active tab URL.
 * Prevents navigation side-effects so the page stays open for screenshots.
 */
async function openPopupAt(context, extensionId, activeTabUrl) {
  const page = await context.newPage();

  await page.addInitScript((url) => {
    // Prevent the popup from closing itself
    window.close = () => {};
    // Prevent chrome.tabs.update with no tabId from navigating the popup tab
    const _origUpdate = chrome.tabs.update.bind(chrome.tabs);
    chrome.tabs.update = (tabId, props, cb) => {
      if (tabId === undefined || tabId === null) return Promise.resolve({});
      return _origUpdate(tabId, props, cb);
    };
    chrome.tabs.create = () => Promise.resolve({});
    // Mock active tab URL
    const origQuery = chrome.tabs.query.bind(chrome.tabs);
    chrome.tabs.query = function (queryInfo, callback) {
      if (queryInfo && queryInfo.active) {
        const tab = [{ id: 1, url, active: true, windowId: 1, title: 'Test Page' }];
        if (typeof callback === 'function') { callback(tab); return; }
        return Promise.resolve(tab);
      }
      return origQuery(queryInfo, callback);
    };
  }, activeTabUrl);

  await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);
  // Wait until renderJumperPanel() completes (hides the loading spinner)
  await page.waitForFunction(
    () => document.getElementById('jumper-loading')?.classList.contains('hidden'),
  );
  return page;
}

async function screenshot(page, name) {
  const outputPath = path.join(OUTPUT_DIR, `${name}.png`);
  // Capture the #app element to get a clean, chrome-free image
  await page.locator('#app').screenshot({ path: outputPath, type: 'png' });
  console.log(`  ✓ ${name}.png`);
}

async function run() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log('Launching extension…');
  const { context, extensionId } = await launchExtension();

  console.log('Seeding storage…');
  await seedStorage(context, SEED_GROUPS);

  console.log('\nCapturing screens:');

  // ── 01: Jumper — matched, active env card shown ────────────────────────────
  {
    const page = await openPopupAt(context, extensionId, 'https://monprojet.fr/contact');
    await screenshot(page, '01-jumper-match');
    await page.close();
  }

  // ── 02: Jumper — matched, secondary env card open (showing links) ──────────
  {
    const page = await openPopupAt(context, extensionId, 'https://monprojet.fr/contact');
    // Click the Staging card (index 1) to reveal its links
    await page.locator('.jumper-card-header').nth(1).click();
    await pause(200);
    await screenshot(page, '02-jumper-links');
    await page.close();
  }

  // ── 03: Jumper — no match ──────────────────────────────────────────────────
  {
    const page = await openPopupAt(context, extensionId, 'https://unknown-site.com/some/page');
    await page.locator('#jumper-no-match').waitFor({ state: 'visible' });
    await screenshot(page, '03-jumper-no-match');
    await page.close();
  }

  // ── 04: Projects list ──────────────────────────────────────────────────────
  {
    const page = await openPopupAt(context, extensionId, 'https://monprojet.fr/contact');
    await page.locator('#tab-environments').click();
    await page.locator('.project-list-item').first().waitFor({ state: 'visible' });
    await screenshot(page, '04-projects-list');
    await page.close();
  }

  // ── 05: Project edit — Envs subtab ────────────────────────────────────────
  {
    const page = await openPopupAt(context, extensionId, 'https://monprojet.fr/contact');
    await page.locator('#tab-environments').click();
    await page.locator('.project-list-item').first().waitFor({ state: 'visible' });
    await page.locator('.project-list-item').first().click();
    await page.locator('.env-card').first().waitFor({ state: 'visible' });
    // Open the first env card and wait for the expanded state
    await page.locator('.env-card-header').first().click();
    await page.locator('.env-card--open').first().waitFor({ state: 'attached' });
    await pause(300);
    await screenshot(page, '05-project-edit-envs');
    await page.close();
  }

  // ── 06: Project edit — CMS subtab ─────────────────────────────────────────
  {
    const page = await openPopupAt(context, extensionId, 'https://monprojet.fr/contact');
    await page.locator('#tab-environments').click();
    await page.locator('.project-list-item').first().waitFor({ state: 'visible' });
    await page.locator('.project-list-item').first().click();
    await page.locator('.project-subtab[data-subtab="cms"]').click();
    await page.locator('#project-subtab-content').waitFor({ state: 'visible' });
    await pause(150);
    await screenshot(page, '06-project-edit-cms');
    await page.close();
  }

  // ── 07: Project edit — Links subtab ───────────────────────────────────────
  {
    const page = await openPopupAt(context, extensionId, 'https://monprojet.fr/contact');
    await page.locator('#tab-environments').click();
    await page.locator('.project-list-item').first().waitFor({ state: 'visible' });
    await page.locator('.project-list-item').first().click();
    await page.locator('.project-subtab[data-subtab="links"]').click();
    await page.locator('#project-subtab-content').waitFor({ state: 'visible' });
    await pause(150);
    await screenshot(page, '07-project-edit-links');
    await page.close();
  }

  // ── 08: Settings panel ────────────────────────────────────────────────────
  {
    const page = await openPopupAt(context, extensionId, 'https://monprojet.fr/contact');
    await page.locator('#tab-settings').click();
    await page.locator('#general-settings-container').waitFor({ state: 'visible' });
    await pause(150);
    await screenshot(page, '08-settings');
    await page.close();
  }

  await context.close();
  console.log(`\nDone! Saved to screenshots/output/extension/`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
