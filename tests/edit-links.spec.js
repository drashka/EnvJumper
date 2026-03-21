import { test, expect } from './fixtures.js';
import { openPopup } from './helpers/extension.js';

/** Helper : crée un projet WordPress et ouvre l'onglet Liens rapides. */
async function openWordPressLinksTab(context, extensionId) {
  const popup = await openPopup(context, extensionId);
  await popup.locator('#tab-environments').click();
  await popup.locator('#add-group-btn').click();

  await popup.locator('.project-subtab[data-subtab="cms"]').click();
  await popup.locator('#project-subtab-content select.select-sm').selectOption('wordpress');

  await popup.locator('.project-subtab[data-subtab="links"]').click();
  return popup;
}

test('sélectionner WordPress génère les liens prédéfinis', async ({ extContext: context, extensionId }) => {
  const popup = await openWordPressLinksTab(context, extensionId);

  const rows = popup.locator('.link-settings-row');
  await expect(rows).toHaveCount(9);

  await expect(popup.locator('.link-settings-row[data-cms-link-id="login"]')).toHaveCount(1);
  await expect(popup.locator('.link-settings-row[data-cms-link-id="dashboard"]')).toHaveCount(1);
  await expect(popup.locator('.link-settings-row[data-cms-link-id="media"]')).toHaveCount(1);

  await popup.close();
});

test('supprimer un lien CMS le fait apparaître dans "Liens CMS disponibles"', async ({ extContext: context, extensionId }) => {
  const popup = await openWordPressLinksTab(context, extensionId);

  await popup.locator('.link-settings-row[data-cms-link-id="media"] .btn-remove-link').click();

  await expect(popup.locator('.link-settings-row[data-cms-link-id="media"]')).toHaveCount(0);
  await expect(popup.locator('.available-cms-links')).toBeVisible();
  await expect(popup.locator('.available-cms-link-row[data-cms-link-id="media"]')).toHaveCount(1);

  await popup.close();
});

test('réajouter un lien depuis "Liens CMS disponibles"', async ({ extContext: context, extensionId }) => {
  const popup = await openWordPressLinksTab(context, extensionId);

  await popup.locator('.link-settings-row[data-cms-link-id="media"] .btn-remove-link').click();

  const countBefore = await popup.locator('.link-settings-row').count();

  await popup.locator('.available-cms-link-row[data-cms-link-id="media"] .btn-restore-cms-link').click();

  await expect(popup.locator('.link-settings-row')).toHaveCount(countBefore + 1);
  await expect(popup.locator('.link-settings-row[data-cms-link-id="media"]')).toHaveCount(1);
  await expect(popup.locator('.available-cms-link-row[data-cms-link-id="media"]')).toHaveCount(0);

  await popup.close();
});

test('ajouter un lien custom', async ({ extContext: context, extensionId }) => {
  const popup = await openPopup(context, extensionId);
  await popup.locator('#tab-environments').click();
  await popup.locator('#add-group-btn').click();
  await popup.locator('.project-subtab[data-subtab="links"]').click();

  const countBefore = await popup.locator('.link-settings-row').count();
  await popup.locator('.btn-add-link').click();

  await expect(popup.locator('.link-settings-row')).toHaveCount(countBefore + 1);

  const newRow = popup.locator('.link-settings-row').last();
  await newRow.locator('input[placeholder="Label"]').fill('UI Kit');
  await newRow.locator('input.link-path-input').fill('/ui-kit');
  await newRow.locator('input.link-path-input').press('Tab');

  const labels = await popup.locator('.link-settings-row input[placeholder="Label"]')
    .evaluateAll((inputs) => inputs.map((i) => i.value));
  expect(labels).toContain('UI Kit');

  await popup.close();
});

test('modifier le label d\'un lien et vérifier la sauvegarde', async ({ extContext: context, extensionId }) => {
  const popup = await openWordPressLinksTab(context, extensionId);

  const loginRow = popup.locator('.link-settings-row[data-cms-link-id="login"]');
  const labelInput = loginRow.locator('input[placeholder="Label"]');
  await labelInput.fill('Se connecter');
  await labelInput.press('Tab');

  await popup.close();
  const popup2 = await openPopup(context, extensionId);
  await popup2.locator('#tab-environments').click();
  await popup2.locator('.project-list-item').first().click();
  await popup2.locator('.project-subtab[data-subtab="links"]').click();

  const labels = await popup2.locator('.link-settings-row input[placeholder="Label"]')
    .evaluateAll((inputs) => inputs.map((i) => i.value));
  expect(labels).toContain('Se connecter');

  await popup2.close();
});

test('réordonner les liens par drag & drop', async ({ extContext: context, extensionId }) => {
  const popup = await openWordPressLinksTab(context, extensionId);

  const rows = popup.locator('.link-settings-row');
  const firstLabel = await rows.first().locator('input[placeholder="Label"]').inputValue();
  const lastLabel = await rows.last().locator('input[placeholder="Label"]').inputValue();

  await popup.evaluate(() => {
    const allRows = document.querySelectorAll('.link-settings-row');
    const source = allRows[allRows.length - 1];
    const target = allRows[0];
    const linkId = source.dataset.linkId;

    const dt = new DataTransfer();
    dt.setData('text/plain', linkId);

    source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: dt }));
    const rect = target.getBoundingClientRect();
    target.dispatchEvent(new DragEvent('dragover', {
      bubbles: true, cancelable: true, dataTransfer: dt,
      clientX: rect.left + 5, clientY: rect.top + 3,
    }));
    target.dispatchEvent(new DragEvent('drop', {
      bubbles: true, cancelable: true, dataTransfer: dt,
      clientX: rect.left + 5, clientY: rect.top + 3,
    }));
    source.dispatchEvent(new DragEvent('dragend', { bubbles: true }));
  });

  await popup.waitForFunction((expected) => {
    const r = document.querySelectorAll('.link-settings-row');
    return r[0]?.querySelector('input[placeholder="Label"]')?.value === expected;
  }, lastLabel, { timeout: 5000 });

  const newFirstLabel = await rows.first().locator('input[placeholder="Label"]').inputValue();
  expect(newFirstLabel).toBe(lastLabel);
  expect(newFirstLabel).not.toBe(firstLabel);

  await popup.close();
  const popup2 = await openPopup(context, extensionId);
  await popup2.locator('#tab-environments').click();
  await popup2.locator('.project-list-item').first().click();
  await popup2.locator('.project-subtab[data-subtab="links"]').click();

  const persistedFirstLabel = await popup2.locator('.link-settings-row').first()
    .locator('input[placeholder="Label"]').inputValue();
  expect(persistedFirstLabel).toBe(lastLabel);

  await popup2.close();
});
