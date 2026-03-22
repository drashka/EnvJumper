import { test, expect } from './fixtures.js';
import { openPopup, clickCreateProject } from './helpers/extension.js';

/**
 * Creates a new empty project and navigates to the CMS sub-tab.
 * Returns the popup.
 */
async function openNewProjectCmsTab(context, extensionId) {
  const popup = await openPopup(context, extensionId);
  await popup.locator('#tab-environments').click();
  await clickCreateProject(popup);
  await popup.locator('.project-subtab[data-subtab="cms"]').click();
  return popup;
}

// ── Test : CMS Joomla ─────────────────────────────────────────────────────────

test('sélectionner Joomla génère 8 liens prédéfinis', async ({ extContext: context, extensionId }) => {
  const popup = await openNewProjectCmsTab(context, extensionId);

  // Select Joomla — use .first() because the WP multisite type select is also
  // rendered (hidden) inside #project-subtab-content when WordPress is selected
  await popup.locator('#project-subtab-content select.select-sm').first().selectOption('joomla');

  // Switch to Links sub-tab and verify 8 predefined links
  await popup.locator('.project-subtab[data-subtab="links"]').click();
  await expect(popup.locator('.link-settings-row')).toHaveCount(8);

  await popup.close();
});

// ── Test : CMS PrestaShop ─────────────────────────────────────────────────────

test('sélectionner PrestaShop affiche le champ cmsAdminPath', async ({ extContext: context, extensionId }) => {
  const popup = await openNewProjectCmsTab(context, extensionId);

  await popup.locator('#project-subtab-content select.select-sm').first().selectOption('prestashop');

  // cmsAdminPath field visible with default value
  const adminPathInput = popup.locator('input[placeholder="/admin-dev"]');
  await expect(adminPathInput).toBeVisible();
  await expect(adminPathInput).toHaveValue('/admin-dev');

  await popup.close();
});

// ── Test : WordPress Multisite ────────────────────────────────────────────────

test('activer WordPress Multisite — champs multisite et ajout de site', async ({ extContext: context, extensionId }) => {
  const popup = await openNewProjectCmsTab(context, extensionId);

  await popup.locator('#project-subtab-content select.select-sm').first().selectOption('wordpress');
  // Wait for CMS config section to render (async DOM update after selectOption)
  await popup.locator('.wp-env-section').waitFor({ state: 'visible' });

  // Multisite section hidden initially
  await expect(popup.locator('.wp-multisite-section')).not.toBeVisible();

  // Toggle multisite — the input is CSS-invisible (width:0, height:0), click the .toggle label
  await popup.locator('.wp-env-section .toggle').first().click();

  // Multisite config section appears
  await expect(popup.locator('.wp-multisite-section')).toBeVisible();

  // Add a site
  await popup.locator('.btn-add-wp-site').click();
  await expect(popup.locator('.wp-site-row')).toHaveCount(1);

  // Network links added to the links sub-tab (6 network links)
  await popup.locator('.project-subtab[data-subtab="links"]').click();
  const rows = popup.locator('.link-settings-row');
  // WordPress: 9 CMS links + 6 network links = 15
  await expect(rows).toHaveCount(15);

  await popup.close();
});

// ── Test : CMS Drupal ─────────────────────────────────────────────────────────

test('sélectionner Drupal génère 9 liens prédéfinis', async ({ extContext: context, extensionId }) => {
  const popup = await openNewProjectCmsTab(context, extensionId);

  await popup.locator('#project-subtab-content select.select-sm').first().selectOption('drupal');

  await popup.locator('.project-subtab[data-subtab="links"]').click();
  await expect(popup.locator('.link-settings-row')).toHaveCount(9);

  await popup.close();
});

// ── Test : CMS Magento ────────────────────────────────────────────────────────

test('sélectionner Magento génère 7 liens prédéfinis', async ({ extContext: context, extensionId }) => {
  const popup = await openNewProjectCmsTab(context, extensionId);

  await popup.locator('#project-subtab-content select.select-sm').first().selectOption('magento');

  await popup.locator('.project-subtab[data-subtab="links"]').click();
  await expect(popup.locator('.link-settings-row')).toHaveCount(7);

  await popup.close();
});

// ── Test : CMS Shopify ────────────────────────────────────────────────────────

test('sélectionner Shopify génère 7 liens prédéfinis', async ({ extContext: context, extensionId }) => {
  const popup = await openNewProjectCmsTab(context, extensionId);

  await popup.locator('#project-subtab-content select.select-sm').first().selectOption('shopify');

  await popup.locator('.project-subtab[data-subtab="links"]').click();
  await expect(popup.locator('.link-settings-row')).toHaveCount(7);

  await popup.close();
});

// ── Test : Changer de CMS → confirmation si des liens existent ────────────────

test('changer de CMS avec des liens existants demande confirmation', async ({ extContext: context, extensionId }) => {
  const popup = await openNewProjectCmsTab(context, extensionId);

  // Select WordPress first (adds 9 links)
  await popup.locator('#project-subtab-content select.select-sm').first().selectOption('wordpress');
  await popup.locator('.wp-env-section').waitFor({ state: 'visible' });

  // Now try to switch to Joomla → confirmation modal should appear
  await popup.locator('#project-subtab-content select.select-sm').first().selectOption('joomla');

  // Confirm dialog appears
  await expect(popup.locator('#confirm-modal')).toBeVisible();

  // Cancel — stays on WordPress
  await popup.locator('#confirm-cancel').click();
  await expect(popup.locator('#project-subtab-content select.select-sm').first()).toHaveValue('wordpress');

  // Try again and confirm
  await popup.locator('#project-subtab-content select.select-sm').first().selectOption('joomla');
  await popup.locator('#confirm-ok').click();

  // Now on Joomla with 8 links
  await popup.locator('.project-subtab[data-subtab="links"]').click();
  await expect(popup.locator('.link-settings-row')).toHaveCount(8);

  await popup.close();
});
