import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testIgnore: ['**/unit/**'],
  timeout: 10000,
  workers: 1, // Extensions need a single persistent context per file
  use: {
    headless: false, // Chrome extensions require headed mode
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
      },
    },
  ],
});
