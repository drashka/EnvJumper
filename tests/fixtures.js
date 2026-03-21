// EnvJumper - https://github.com/drashka/EnvJumper
// Copyright (C) 2026 Drashka
// Licence : GPL v3 — voir le fichier LICENSE

import { test as base, expect } from '@playwright/test';
import { launchBrowserWithExtension, clearStorage } from './helpers/extension.js';

export { expect };

/**
 * Worker-scoped fixtures: Chrome launches once for the entire test suite.
 * Auto-clears storage before every test for isolation.
 */
export const test = base.extend({
  // Launched once per worker (workers: 1 → once for all 39 tests)
  _browser: [async ({}, use) => {
    const result = await launchBrowserWithExtension();
    await use(result);
    await result.context.close();
  }, { scope: 'worker' }],

  // Expose context under a non-conflicting name at worker scope
  extContext: [async ({ _browser }, use) => {
    await use(_browser.context);
  }, { scope: 'worker' }],

  extensionId: [async ({ _browser }, use) => {
    await use(_browser.extensionId);
  }, { scope: 'worker' }],

  // Runs automatically before every test — no need for beforeEach in spec files
  _clearStorage: [async ({ extContext }, use) => {
    await clearStorage(extContext);
    await use();
  }, { auto: true }],
});
