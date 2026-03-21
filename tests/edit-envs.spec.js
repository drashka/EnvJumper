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
 * Opens the popup and navigates to the first project's Environments sub-tab.
 * The project must already be seeded in storage.
 */
async function openFirstProjectEnvs(context, extensionId) {
  const popup = await openPopup(context, extensionId);
  await popup.locator('#tab-environments').click();
  await popup.locator('.project-list-item').first().click();
  // Wait for the env cards to be rendered before interacting
  await popup.locator('.env-card').first().waitFor({ state: 'visible' });
  return popup;
}

const GROUP = {
  id: 'group-1',
  name: 'Mon Projet',
  cms: 'none',
  cmsAdminPath: '',
  isWordPressMultisite: false,
  wpMultisiteType: 'subdomain',
  wpSites: [],
  links: [],
  environments: [
    { id: 'env-1', name: 'Production', domain: 'monprojet.com', protocol: 'https', color: '#EF4444' },
  ],
};

// ── Test : Modifier le nom d'un env ──────────────────────────────────────────

test('modifier le nom d\'un env — persistance', async ({ extContext: context, extensionId }) => {
  await seedGroups(context, extensionId, [GROUP]);
  const popup = await openFirstProjectEnvs(context, extensionId);

  // Expand the env card and wait for body to be visible
  await popup.locator('.env-card-header').first().click();
  await popup.locator('.env-card--open').first().waitFor({ state: 'attached' });

  const nameInput = popup.locator('.env-card input.env-name-input').first();
  await nameInput.fill('Prod Renommée');
  await nameInput.press('Tab');

  // Header label updates immediately
  await expect(popup.locator('.env-card-name').first()).toHaveText('Prod Renommée');

  // Reopen and verify persistence
  await popup.close();
  const popup2 = await openFirstProjectEnvs(context, extensionId);
  await popup2.locator('.env-card-header').first().click();
  await popup2.locator('.env-card--open').first().waitFor({ state: 'attached' });
  const val = await popup2.locator('.env-card input.env-name-input').first().inputValue();
  expect(val).toBe('Prod Renommée');

  await popup2.close();
});

// ── Test : Coller une URL complète dans le domaine ────────────────────────────

test('coller une URL complète dans le champ domaine — extraction auto', async ({ extContext: context, extensionId }) => {
  await seedGroups(context, extensionId, [GROUP]);
  const popup = await openFirstProjectEnvs(context, extensionId);

  await popup.locator('.env-card-header').first().click();
  await popup.locator('.env-card--open').first().waitFor({ state: 'attached' });

  const domainInput = popup.locator('.env-card input.env-domain-input').first();
  const protocolSelect = popup.locator('.env-card .env-protocol-select').first();

  // Paste a full URL with http
  await domainInput.fill('http://staging.monprojet.com/some/path?q=1');
  await domainInput.press('Tab');

  // Domain stripped from URL
  await expect(domainInput).toHaveValue('staging.monprojet.com');
  // Protocol auto-detected
  await expect(protocolSelect).toHaveValue('http');

  await popup.close();
});

// ── Test : Supprimer un environnement ─────────────────────────────────────────

test('supprimer un environnement', async ({ extContext: context, extensionId }) => {
  // Seed a project with 2 envs so that deleting one doesn't leave zero
  const group = {
    ...GROUP,
    environments: [
      { id: 'env-1', name: 'Production', domain: 'monprojet.com', protocol: 'https', color: '#EF4444' },
      { id: 'env-2', name: 'Staging', domain: 'staging.monprojet.com', protocol: 'https', color: '#F97316' },
    ],
  };
  await seedGroups(context, extensionId, [group]);
  const popup = await openFirstProjectEnvs(context, extensionId);

  await expect(popup.locator('.env-card')).toHaveCount(2);

  // Click trash on the first env card
  await popup.locator('.env-card-header').first().locator('.btn-icon-trash').click();
  await popup.locator('#confirm-ok').click();

  await expect(popup.locator('.env-card')).toHaveCount(1);

  await popup.close();
});

// ── Test : Basic Auth toggle ──────────────────────────────────────────────────

test('activer Basic Auth — champs visibles et persistance', async ({ extContext: context, extensionId }) => {
  await seedGroups(context, extensionId, [GROUP]);
  const popup = await openFirstProjectEnvs(context, extensionId);

  await popup.locator('.env-card-header').first().click();
  await popup.locator('.env-card--open').first().waitFor({ state: 'attached' });

  // Basic auth fields are hidden by default
  await expect(popup.locator('.basic-auth-fields').first()).not.toBeVisible();

  // Enable Basic Auth toggle — click .toggle label since the input is CSS-invisible (width:0, height:0)
  await popup.locator('.basic-auth-toggle-row .toggle').first().click();

  // Fields appear
  await expect(popup.locator('.basic-auth-fields').first()).toBeVisible();

  // Fill credentials
  const usernameInput = popup.locator('.basic-auth-fields input[type="text"]').first();
  const passwordInput = popup.locator('.basic-auth-fields input[type="password"]').first();

  await usernameInput.fill('admin');
  await usernameInput.press('Tab');
  await passwordInput.fill('secret123');
  await passwordInput.press('Tab');

  // Reopen and verify persistence
  await popup.close();
  const popup2 = await openFirstProjectEnvs(context, extensionId);
  await popup2.locator('.env-card-header').first().click();
  await popup2.locator('.env-card--open').first().waitFor({ state: 'attached' });
  await expect(popup2.locator('.basic-auth-toggle-row input[type="checkbox"]').first()).toBeChecked();
  await expect(popup2.locator('.basic-auth-fields').first()).toBeVisible();

  const persistedUser = await popup2.locator('.basic-auth-fields input[type="text"]').first().inputValue();
  const persistedPass = await popup2.locator('.basic-auth-fields input[type="password"]').first().inputValue();
  expect(persistedUser).toBe('admin');
  expect(persistedPass).toBe('secret123');

  await popup2.close();
});

// ── Test : Bouton œil sur le mot de passe ────────────────────────────────────

test('bouton œil — bascule la visibilité du mot de passe', async ({ extContext: context, extensionId }) => {
  const groupWithAuth = {
    ...GROUP,
    environments: [{
      id: 'env-1', name: 'Production', domain: 'monprojet.com', protocol: 'https', color: '#EF4444',
      basicAuth: { enabled: true, username: 'admin', password: 'secret' },
    }],
  };
  await seedGroups(context, extensionId, [groupWithAuth]);
  const popup = await openFirstProjectEnvs(context, extensionId);

  await popup.locator('.env-card-header').first().click();
  await popup.locator('.env-card--open').first().waitFor({ state: 'attached' });

  // Since basicAuth is enabled, the fields are already visible
  const eyeBtn = popup.locator('.btn-eye').first();
  // Find the password input by its wrapper (not via [type="password"] attr selector
  // since clicking the eye changes the type)
  const passInput = popup.locator('.basic-auth-pass-wrapper input').first();

  await expect(passInput).toHaveAttribute('type', 'password');

  // Click eye → reveal
  await eyeBtn.click();
  await expect(passInput).toHaveAttribute('type', 'text');

  // Click again → hide
  await eyeBtn.click();
  await expect(passInput).toHaveAttribute('type', 'password');

  await popup.close();
});
