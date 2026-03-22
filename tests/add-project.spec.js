import { test, expect } from './fixtures.js';
import { openPopup, openPopupWithActiveTab, clickCreateProject } from './helpers/extension.js';

// ── Test 1 : Ajouter un projet vide ────────────────────────────────────────

test('ajouter un projet vide depuis l\'onglet Projets', async ({ extContext: context, extensionId }) => {
  const popup = await openPopup(context, extensionId);

  await popup.locator('#tab-environments').click();
  await clickCreateProject(popup);

  // La vue d'édition s'ouvre (drill-down)
  await expect(popup.locator('.projects-view--edit')).toBeVisible();

  // Un environnement vide est pré-créé
  await expect(popup.locator('.env-card')).toHaveCount(1);

  await popup.close();
});

// ── Test 2 : Pré-remplissage depuis l'URL active — via Jumper "Nouveau projet"

test('pré-remplissage depuis l\'URL active via le bouton "Nouveau projet" du Jumper', async ({ extContext: context, extensionId }) => {
  // Seed an existing (unrelated) group so the Jumper shows the no-match panel
  // instead of the empty-state screen (which appears when there are no groups at all).
  const seedPopup = await openPopup(context, extensionId);
  await seedPopup.evaluate(() => new Promise((resolve) => {
    chrome.storage.local.set({
      groups: [{
        id: 'seed-group',
        name: 'Autre Projet',
        cms: 'none',
        cmsAdminPath: '',
        isWordPressMultisite: false,
        wpMultisiteType: 'subdomain',
        wpSites: [],
        links: [],
        environments: [
          { id: 'env-seed', name: 'Production', domain: 'otherproject.com', protocol: 'https', color: '#EF4444' },
        ],
      }],
    }, resolve);
  }));
  await seedPopup.close();

  // Mock the active tab so chrome.tabs.query returns example.com
  const popup = await openPopupWithActiveTab(
    context, extensionId, 'https://example.com/some-page',
  );

  // Le Jumper affiche le panneau "aucune correspondance"
  await expect(popup.locator('#jumper-no-match')).toBeVisible();

  // Cliquer sur "Nouveau projet"
  await popup.locator('.no-match-btn.btn-primary').click();

  // On bascule sur l'onglet Projets avec la vue d'édition ouverte
  await expect(popup.locator('.projects-view--edit')).toBeVisible();

  // Le nom du projet est dérivé du hostname ("Example")
  const nameInput = popup.locator('#project-edit-name-input');
  await expect(nameInput).toHaveValue('Example');

  // Le domaine du premier environnement est pré-rempli
  const domainInput = popup.locator('.env-card input.env-domain-input').first();
  await expect(domainInput).toHaveValue('example.com');

  await popup.close();
});

// ── Test 3 : "Ajouter à un projet" depuis le Jumper ────────────────────────

test('"Ajouter à un projet" ajoute un env au projet existant', async ({ extContext: context, extensionId }) => {
  // Créer un projet existant avec le domaine myproject.com
  const setupPopup = await openPopup(context, extensionId);
  await setupPopup.evaluate(() => {
    return new Promise((resolve) => {
      const group = {
        id: 'test-group-1',
        name: 'Mon Projet',
        cms: 'none',
        cmsAdminPath: '',
        isWordPressMultisite: false,
        wpMultisiteType: 'subdomain',
        wpSites: [],
        links: [],
        environments: [
          { id: 'env-1', name: 'Production', domain: 'myproject.com', protocol: 'https', color: '#EF4444' },
        ],
      };
      chrome.storage.local.set({ groups: [group] }, resolve);
    });
  });
  await setupPopup.close();

  // Mock the active tab to simulate being on an unknown domain
  const popup = await openPopupWithActiveTab(context, extensionId, 'https://example.org');

  // Le Jumper affiche le panneau no-match avec le bouton "Ajouter à un projet"
  await expect(popup.locator('#jumper-no-match')).toBeVisible();
  await expect(popup.locator('.no-match-btn.btn-outline')).toBeVisible();

  // Cliquer sur "Ajouter à un projet" → drill-down avec la liste des projets
  await popup.locator('.no-match-btn.btn-outline').click();
  await expect(popup.locator('#jumper-projects-list')).toContainText('Mon Projet');

  // Choisir "Mon Projet"
  await popup.locator('#jumper-projects-list button').filter({ hasText: 'Mon Projet' }).click();

  // On bascule sur l'onglet Projets avec la vue d'édition du projet ouverte
  await expect(popup.locator('.projects-view--edit')).toBeVisible();

  // Un second environnement a été ajouté (domaine example.org)
  const domainInputs = popup.locator('.env-card input.env-domain-input');
  const values = await domainInputs.evaluateAll((inputs) => inputs.map((i) => i.value));
  expect(values).toContain('example.org');

  await popup.close();
});

// ── Test 4 : Ajouter un second environnement ────────────────────────────────

test('ajouter un second environnement à un projet existant', async ({ extContext: context, extensionId }) => {
  const popup = await openPopup(context, extensionId);

  await popup.locator('#tab-environments').click();
  await clickCreateProject(popup);

  // Aller dans le sous-onglet Environnements
  await popup.locator('.project-subtab[data-subtab="envs"]').click();
  await popup.locator('.btn-add-env').click();

  const cards = popup.locator('.env-card');
  await expect(cards).toHaveCount(2);

  await popup.close();
});

// ── Test 5 : Supprimer un projet ────────────────────────────────────────────

test('supprimer un projet', async ({ extContext: context, extensionId }) => {
  const popup = await openPopup(context, extensionId);

  await popup.locator('#tab-environments').click();
  await clickCreateProject(popup);

  // Aller dans le sous-onglet Paramètres
  await popup.locator('.project-subtab[data-subtab="settings"]').click();
  await popup.locator('.btn-delete-project').click();

  // Confirmer la suppression dans la modal
  await popup.locator('#confirm-ok').click();

  // Le projet ne doit plus apparaître dans la liste
  await expect(popup.locator('#groups-list .project-list-item')).toHaveCount(0);

  await popup.close();
});
