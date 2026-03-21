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

/**
 * Opens the popup with a mocked active tab URL.
 * Also mocks chrome.tabs.update / create to capture navigations,
 * and prevents window.close() from closing the Playwright page.
 */
async function openPopupWithMocks(context, extensionId, activeTabUrl) {
  const popupPage = await context.newPage();
  await popupPage.addInitScript((url) => {
    try {
      window._nav = [];

      // Mock active tab
      const origQuery = chrome.tabs.query.bind(chrome.tabs);
      chrome.tabs.query = function (queryInfo, callback) {
        if (queryInfo && queryInfo.active) {
          const tab = [{ id: 1, url, active: true, windowId: 1, title: 'Test Page' }];
          if (typeof callback === 'function') { callback(tab); return; }
          return Promise.resolve(tab);
        }
        return origQuery(queryInfo, callback);
      };

      // Record navigations instead of actually navigating
      chrome.tabs.update = function (tabId, props) {
        window._nav.push({ type: 'update', url: props?.url });
        return Promise.resolve({});
      };
      chrome.tabs.create = function (props) {
        window._nav.push({ type: 'create', url: props?.url });
        return Promise.resolve({});
      };

      // Prevent popup from closing in Playwright
      window.close = function () {};
    } catch (_) { /* ignore */ }
  }, activeTabUrl);

  await popupPage.goto(`chrome-extension://${extensionId}/popup/popup.html`);
  await popupPage.waitForFunction(
    () => document.getElementById('tab-environments')?.textContent?.trim() !== '',
  );
  return popupPage;
}

// ── Test data ─────────────────────────────────────────────────────────────────

const GROUP_MULTI = {
  id: 'group-multi',
  name: 'Projet Alpha',
  cms: 'none',
  cmsAdminPath: '',
  isWordPressMultisite: false,
  wpMultisiteType: 'subdomain',
  wpSites: [],
  links: [],
  environments: [
    { id: 'env-1', name: 'Production', domain: 'alpha.com', protocol: 'https', color: '#EF4444' },
    { id: 'env-2', name: 'Staging', domain: 'staging.alpha.com', protocol: 'https', color: '#F97316' },
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

// ── Test : Correspondance trouvée ─────────────────────────────────────────────

test('correspondance trouvée — card et badge "Actuel" affichés', async ({ extContext: context, extensionId }) => {
  await seedGroups(context, extensionId, [GROUP_MULTI]);
  const popup = await openPopupWithMocks(context, extensionId, 'https://alpha.com/dashboard');

  await expect(popup.locator('#jumper-match')).toBeVisible();
  await expect(popup.locator('#jumper-group-name')).toHaveText('Projet Alpha');

  // Current env (Production) is first and marked as active
  await expect(popup.locator('.jumper-card.is-current')).toBeVisible();
  await expect(popup.locator('.jumper-card.is-current .badge-current')).toBeVisible();
  await expect(popup.locator('.jumper-card.is-current .jumper-card-name')).toHaveText('Production');

  // Two env cards total; Staging is not current
  await expect(popup.locator('.jumper-card')).toHaveCount(2);
  await expect(popup.locator('.jumper-card:not(.is-current) .badge-current')).toHaveCount(0);
  await expect(popup.locator('.jumper-card:not(.is-current) .jumper-card-name')).toHaveText('Staging');

  await popup.close();
});

// ── Test : Aucune correspondance ──────────────────────────────────────────────

test('aucune correspondance — panneau no-match avec hostname et boutons d\'action', async ({ extContext: context, extensionId }) => {
  await seedGroups(context, extensionId, [GROUP_MULTI]);
  const popup = await openPopupWithMocks(context, extensionId, 'https://unknown-domain.com/page');

  await expect(popup.locator('#jumper-no-match')).toBeVisible();
  await expect(popup.locator('#jumper-match')).not.toBeVisible();
  await expect(popup.locator('.empty-hostname')).toHaveText('unknown-domain.com');
  await expect(popup.locator('.no-match-btn.btn-primary')).toBeVisible();
  await expect(popup.locator('.no-match-btn.btn-outline')).toBeVisible();

  await popup.close();
});

// ── Test : Accordéon no-match ─────────────────────────────────────────────────

test('accordéon no-match — liste les projets et leurs envs', async ({ extContext: context, extensionId }) => {
  await seedGroups(context, extensionId, [GROUP_MULTI, GROUP_B]);
  const popup = await openPopupWithMocks(context, extensionId, 'https://unknown.com');

  await expect(popup.locator('#jumper-no-match')).toBeVisible();
  await expect(popup.locator('.no-match-project')).toHaveCount(2);
  await expect(popup.locator('.no-match-project-name').nth(0)).toHaveText('Projet Alpha');
  await expect(popup.locator('.no-match-project-name').nth(1)).toHaveText('Projet Beta');

  // Click to expand first project
  await popup.locator('.no-match-project').nth(0).locator('.no-match-project-header').click();
  await expect(popup.locator('.no-match-project').nth(0)).toHaveClass(/open/);

  // Both envs of Projet Alpha are visible as rows
  await expect(popup.locator('.no-match-project').nth(0).locator('.no-match-env-row')).toHaveCount(2);

  await popup.close();
});

// ── Test : Recherche dans no-match ────────────────────────────────────────────

test('recherche dans le Jumper — filtre par nom de projet', async ({ extContext: context, extensionId }) => {
  await seedGroups(context, extensionId, [GROUP_MULTI, GROUP_B]);
  const popup = await openPopupWithMocks(context, extensionId, 'https://unknown.com');

  await expect(popup.locator('.no-match-project')).toHaveCount(2);

  // Filter: only "alpha" matches Projet Alpha
  await popup.locator('.no-match-search').fill('alpha');
  await expect(popup.locator('.no-match-project')).toHaveCount(1);
  await expect(popup.locator('.no-match-project-name')).toHaveText('Projet Alpha');

  // Search with no match
  await popup.locator('.no-match-search').fill('xyznotfound');
  await expect(popup.locator('.no-match-project')).toHaveCount(0);
  await expect(popup.locator('.no-match-no-results')).not.toHaveClass(/hidden/);

  // Clear → all projects back
  await popup.locator('.no-match-search').fill('');
  await expect(popup.locator('.no-match-project')).toHaveCount(2);

  await popup.close();
});
