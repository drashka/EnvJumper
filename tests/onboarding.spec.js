// EnvJumper - https://github.com/drashka/EnvJumper
// Copyright (C) 2026 Drashka
// Licence : GPL v3 — voir le fichier LICENSE

import { test, expect } from './fixtures.js';
import { openPopup, openPopupWithActiveTab } from './helpers/extension.js';

// ── Test 1 : Écran d'onboarding — onglet Projets vide ────────────────────────

test('onboarding — affiché dans l\'onglet Projets quand aucun groupe', async ({ extContext: context, extensionId }) => {
  const popup = await openPopup(context, extensionId);

  await popup.locator('#tab-environments').click();

  // L'écran d'onboarding doit être visible
  await expect(popup.locator('.onboarding-screen')).toBeVisible();
  await expect(popup.locator('.onboarding-title')).toBeVisible();

  // Le bouton "Ajouter un projet" normal est masqué par l'onboarding
  await expect(popup.locator('#add-group-btn')).not.toBeVisible();

  // Les deux boutons d'action de l'onboarding sont présents
  await expect(popup.locator('.onboarding-btn')).toHaveCount(2);

  await popup.close();
});

// ── Test 2 : Bouton "Créer mon premier projet" ouvre l'édition ───────────────

test('onboarding — bouton "Créer mon premier projet" ouvre la vue d\'édition', async ({ extContext: context, extensionId }) => {
  const popup = await openPopup(context, extensionId);

  await popup.locator('#tab-environments').click();
  await popup.locator('.onboarding-btn').first().click();

  // La vue d'édition s'ouvre
  await expect(popup.locator('.projects-view--edit')).toBeVisible();

  // Un environnement vide est pré-créé
  await expect(popup.locator('.env-card')).toHaveCount(1);

  await popup.close();
});

// ── Test 3 : L'onboarding disparaît quand un groupe est créé ─────────────────

test('onboarding — disparaît après création d\'un projet', async ({ extContext: context, extensionId }) => {
  const popup = await openPopup(context, extensionId);

  await popup.locator('#tab-environments').click();

  // Écran d'onboarding visible
  await expect(popup.locator('.onboarding-screen')).toBeVisible();

  // Créer un projet via le bouton d'onboarding
  await popup.locator('.onboarding-btn').first().click();

  // Revenir à la liste
  await popup.locator('#project-back-btn').click();

  // L'onboarding doit avoir disparu — le projet apparaît dans la liste
  await expect(popup.locator('.onboarding-screen')).not.toBeVisible();
  await expect(popup.locator('.project-list-item')).toHaveCount(1);
  // Le bouton "Ajouter un projet" est maintenant visible
  await expect(popup.locator('#add-group-btn')).toBeVisible();

  await popup.close();
});

// ── Test 4 : État vide du Jumper quand aucun groupe ──────────────────────────

test('jumper empty state — affiché quand aucun groupe configuré', async ({ extContext: context, extensionId }) => {
  // Aucun groupe → le Jumper affiche l'écran vide (et non le panneau no-match classique)
  const popup = await openPopupWithActiveTab(
    context, extensionId, 'https://example.com/',
  );

  // L'écran vide est dans #jumper-no-match
  await expect(popup.locator('#jumper-no-match')).toBeVisible();
  await expect(popup.locator('.jumper-empty-state')).toBeVisible();
  await expect(popup.locator('.jumper-empty-msg')).toBeVisible();

  // Un bouton de configuration est présent
  await expect(popup.locator('.jumper-empty-state .btn')).toBeVisible();

  // Les éléments du panneau no-match classique ne sont PAS présents
  await expect(popup.locator('.no-match-btn')).toHaveCount(0);
  await expect(popup.locator('.no-match-search')).toHaveCount(0);

  await popup.close();
});

// ── Test 5 : Bouton "Configurer" dans le Jumper vide bascule sur Projets ──────

test('jumper empty state — bouton bascule sur l\'onglet Projets', async ({ extContext: context, extensionId }) => {
  const popup = await openPopupWithActiveTab(
    context, extensionId, 'https://example.com/',
  );

  await expect(popup.locator('.jumper-empty-state')).toBeVisible();

  // Cliquer sur le bouton de configuration
  await popup.locator('.jumper-empty-state .btn').click();

  // On bascule sur l'onglet Projets
  await expect(popup.locator('#tab-environments')).toHaveClass(/active/);
  await expect(popup.locator('.onboarding-screen')).toBeVisible();

  await popup.close();
});
