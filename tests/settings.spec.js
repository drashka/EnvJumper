import { test, expect } from './fixtures.js';
import { openPopup } from './helpers/extension.js';

/** Opens the popup and navigates to the Settings tab, waiting for async render. */
async function openSettingsTab(context, extensionId) {
  const popup = await openPopup(context, extensionId);
  await popup.locator('#tab-settings').click();
  // renderSettingsPanel() is async — wait for the first toggle row to appear
  await popup.locator('.toggle-row').first().waitFor({ state: 'visible' });
  return popup;
}

/** Reads settings from chrome.storage.sync. */
async function readSettings(popup) {
  return popup.evaluate(() => new Promise((resolve) => {
    chrome.storage.sync.get('settings', (r) => resolve(r.settings || {}));
  }));
}

// ── Test : Toggle showFrame ───────────────────────────────────────────────────

test('toggle showFrame — persistance dans storage.sync', async ({ extContext: context, extensionId }) => {
  const popup = await openSettingsTab(context, extensionId);

  // First toggle row = showFrame
  // The input is CSS-invisible (width:0, height:0) — click the .toggle label wrapper
  const toggleRow = popup.locator('.toggle-row').nth(0);
  const toggleInput = toggleRow.locator('input[type="checkbox"]');
  const initialState = await toggleInput.isChecked();

  await toggleRow.locator('.toggle').click();

  // Navigate away and back to force re-read from storage
  await popup.locator('#tab-environments').click();
  await popup.locator('#tab-settings').click();
  await popup.locator('.toggle-row').first().waitFor({ state: 'visible' });

  const newState = await popup.locator('.toggle-row').nth(0).locator('input[type="checkbox"]').isChecked();
  expect(newState).toBe(!initialState);

  const settings = await readSettings(popup);
  expect(settings.showFrame).toBe(!initialState);

  await popup.close();
});

// ── Test : Toggle showLabel ───────────────────────────────────────────────────

test('toggle showLabel — masque la section position/taille', async ({ extContext: context, extensionId }) => {
  const popup = await openSettingsTab(context, extensionId);

  // Second toggle row = showLabel
  const toggleRow = popup.locator('.toggle-row').nth(1);
  const toggle = toggleRow.locator('input[type="checkbox"]');

  // Ensure label is enabled to start
  if (!(await toggle.isChecked())) await toggleRow.locator('.toggle').click();
  await expect(popup.locator('.marker-position-wrapper')).not.toHaveClass(/marker-position-wrapper--hidden/);

  // Disable label
  await toggleRow.locator('.toggle').click();
  await expect(popup.locator('.marker-position-wrapper')).toHaveClass(/marker-position-wrapper--hidden/);

  // Re-enable
  await toggleRow.locator('.toggle').click();
  await expect(popup.locator('.marker-position-wrapper')).not.toHaveClass(/marker-position-wrapper--hidden/);

  await popup.close();
});

// ── Test : Changer labelPosition ─────────────────────────────────────────────

test('changer labelPosition — persistance', async ({ extContext: context, extensionId }) => {
  const popup = await openSettingsTab(context, extensionId);

  // Click "top-right" position button
  await popup.locator('[data-pos="top-right"]').click();
  await expect(popup.locator('[data-pos="top-right"]')).toHaveClass(/active/);

  // Navigate away and back to verify persistence
  await popup.locator('#tab-environments').click();
  await popup.locator('#tab-settings').click();
  await popup.locator('.toggle-row').first().waitFor({ state: 'visible' });

  await expect(popup.locator('[data-pos="top-right"]')).toHaveClass(/active/);
  await expect(popup.locator('[data-pos="top-left"]')).not.toHaveClass(/active/);

  const settings = await readSettings(popup);
  expect(settings.labelPosition).toBe('top-right');

  await popup.close();
});

// ── Test : Changer labelSize ──────────────────────────────────────────────────

test('changer labelSize — persistance', async ({ extContext: context, extensionId }) => {
  const popup = await openSettingsTab(context, extensionId);

  // Click size "L"
  await popup.locator('[data-size="l"]').click();
  await expect(popup.locator('[data-size="l"]')).toHaveClass(/active/);

  // Navigate away and back
  await popup.locator('#tab-environments').click();
  await popup.locator('#tab-settings').click();
  await popup.locator('.toggle-row').first().waitFor({ state: 'visible' });

  await expect(popup.locator('[data-size="l"]')).toHaveClass(/active/);
  await expect(popup.locator('[data-size="m"]')).not.toHaveClass(/active/);

  const settings = await readSettings(popup);
  expect(settings.labelSize).toBe('l');

  await popup.close();
});
