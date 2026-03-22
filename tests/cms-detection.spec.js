// EnvJumper - https://github.com/drashka/EnvJumper
// Copyright (C) 2026 Drashka
// Licence : GPL v3 — voir le fichier LICENSE

import { test, expect } from './fixtures.js';

const GROUP_NO_CMS = {
  id: 'group-detect',
  name: 'Projet Détection',
  cms: 'none',
  cmsAdminPath: '',
  isWordPressMultisite: false,
  wpMultisiteType: 'subdomain',
  wpSites: [],
  links: [],
  environments: [
    { id: 'env-d1', name: 'Production', domain: 'mysite.com', protocol: 'https', color: '#EF4444' },
  ],
};

/**
 * Opens the popup with:
 * - chrome.tabs.query mocked to return a specific active tab URL
 * - chrome.scripting.executeScript mocked to return a fake detection result
 */
async function openPopupWithDetection(context, extensionId, activeTabUrl, scriptingResult) {
  const popup = await context.newPage();
  await popup.addInitScript(({ url, result }) => {
    window.close = () => {};
    const _orig = chrome.tabs.update.bind(chrome.tabs);
    chrome.tabs.update = (tabId, props, cb) => {
      if (tabId === undefined || tabId === null) return Promise.resolve({});
      return _orig(tabId, props, cb);
    };
    chrome.tabs.query = (queryInfo, callback) => {
      if (queryInfo && queryInfo.active) {
        const tab = [{ id: 42, url, active: true, windowId: 1, title: 'Test' }];
        if (typeof callback === 'function') { callback(tab); return; }
        return Promise.resolve(tab);
      }
      return Promise.resolve([]);
    };
    try {
      chrome.scripting.executeScript = () => Promise.resolve([{ result }]);
    } catch (_) {}
  }, { url: activeTabUrl, result: scriptingResult });

  await popup.goto(`chrome-extension://${extensionId}/popup/popup.html`);
  await popup.waitForFunction(
    () => document.getElementById('jumper-loading')?.classList.contains('hidden'),
  );
  return popup;
}

/** Seeds a group directly via the service worker. */
async function seedGroup(context, group) {
  const sw = context.serviceWorkers()[0];
  await sw.evaluate((g) => new Promise((r) => chrome.storage.local.set({ groups: [g] }, r)), group);
}

// ── Test : bannière de détection CMS ─────────────────────────────────────────

test('bannière CMS — apparaît et active WordPress', async ({ extContext: context, extensionId }) => {
  await seedGroup(context, GROUP_NO_CMS);

  const popup = await openPopupWithDetection(
    context, extensionId,
    'https://mysite.com/',
    { cms: 'wordpress', isMultisite: false, multisiteSites: [], multisiteType: null },
  );

  await popup.locator('#tab-environments').click();
  await popup.locator('.project-list-item').first().click();
  await popup.locator('.project-subtab[data-subtab="cms"]').click();

  // Banner appears asynchronously after detection
  const banner = popup.locator('.cms-detection-banner');
  await banner.waitFor({ state: 'visible', timeout: 5000 });
  await expect(banner).toContainText('WordPress');

  // Click "Activer" — banner removed, CMS applied
  await banner.locator('button').click();
  await expect(popup.locator('.cms-detection-banner')).toHaveCount(0);
  await expect(popup.locator('#project-subtab-content select.select-sm').first()).toHaveValue('wordpress');
  await expect(popup.locator('.wp-env-section')).toBeVisible();

  await popup.close();
});

// ── Test : pas de bannière si CMS déjà configuré ─────────────────────────────

test('bannière CMS — absente si le CMS est déjà configuré', async ({ extContext: context, extensionId }) => {
  await seedGroup(context, { ...GROUP_NO_CMS, cms: 'wordpress' });

  const popup = await openPopupWithDetection(
    context, extensionId,
    'https://mysite.com/',
    { cms: 'wordpress', isMultisite: false, multisiteSites: [], multisiteType: null },
  );

  await popup.locator('#tab-environments').click();
  await popup.locator('.project-list-item').first().click();
  await popup.locator('.project-subtab[data-subtab="cms"]').click();

  // Allow async detection to complete, then verify no banner
  await popup.waitForTimeout(500);
  await expect(popup.locator('.cms-detection-banner')).toHaveCount(0);

  await popup.close();
});

// ── Test : bannière multisite — applique les sites détectés ──────────────────

test('bannière CMS — "Activer" applique WordPress Multisite avec les sites détectés', async ({ extContext: context, extensionId }) => {
  await seedGroup(context, GROUP_NO_CMS);

  const popup = await openPopupWithDetection(
    context, extensionId,
    'https://mysite.com/',
    {
      cms: 'wordpress',
      isMultisite: true,
      multisiteType: 'subdirectory',
      multisiteSites: [
        { label: 'English', domain: 'mysite.com', path: 'en' },
        { label: 'Français', domain: 'mysite.com', path: 'fr' },
      ],
    },
  );

  await popup.locator('#tab-environments').click();
  await popup.locator('.project-list-item').first().click();
  await popup.locator('.project-subtab[data-subtab="cms"]').click();

  const banner = popup.locator('.cms-detection-banner');
  await banner.waitFor({ state: 'visible', timeout: 5000 });
  await banner.locator('button').click();

  // CMS applied
  await expect(popup.locator('#project-subtab-content select.select-sm').first()).toHaveValue('wordpress');

  // Multisite section visible with 2 detected sites
  await expect(popup.locator('.wp-multisite-section')).toBeVisible();
  await expect(popup.locator('.wp-site-row')).toHaveCount(2);

  await popup.close();
});
