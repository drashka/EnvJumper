// EnvJumper - https://github.com/drashka/EnvJumper
// Copyright (C) 2026 Drashka
// Licence : GPL v3 — voir le fichier LICENSE

import http from 'http';
import { test, expect } from './fixtures.js';

const USER = 'user';
const PASS = 'secret';

/**
 * Local server protected by HTTP Basic Auth; records the Authorization header
 * of every request to /page. A fresh server (new port, hence new origin) is
 * started for each test because Chrome remembers accepted credentials per origin.
 */
let server;
let host;
let attempts;

test.beforeEach(async () => {
  attempts = [];
  server = http.createServer((req, res) => {
    const header = req.headers.authorization;
    if (header && req.url === '/page') attempts.push(header);
    const expected = `Basic ${Buffer.from(`${USER}:${PASS}`).toString('base64')}`;
    if (header !== expected) {
      res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="EnvJumper test"' });
      res.end('Unauthorized');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<!doctype html><html><body><h1 id="ok">Protected</h1></body></html>');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  host = `127.0.0.1:${server.address().port}`;
});

test.afterEach(async () => {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
});

/** Builds a single-env project pointing at the local server. */
function buildGroups(basicAuth) {
  return [{
    id: 'g-auth',
    name: 'Projet Auth',
    cms: 'none',
    links: [],
    environments: [
      { id: 'e-auth', name: 'Staging', domain: host, protocol: 'http', color: '#F97316', basicAuth },
    ],
  }];
}

/** Returns the live extension service worker, waiting for it to (re)start if needed. */
async function getWorker(context) {
  return context.serviceWorkers()[0] || context.waitForEvent('serviceworker');
}

/** Stores the groups and waits until the service worker has reloaded its auth cache. */
async function setGroups(context, groups) {
  const sw = await getWorker(context);
  await sw.evaluate((g) => chrome.storage.local.set({ groups: g }), groups);
  // The cache reload is triggered by storage.onChanged; one more round trip lets it settle
  await sw.evaluate(() => chrome.storage.local.get('groups'));
}

test('Basic Auth — identifiants injectés automatiquement', async ({ extContext: context }) => {
  await setGroups(context, buildGroups({ enabled: true, username: USER, password: PASS }));

  const page = await context.newPage();
  await page.goto(`http://${host}/page`);
  await expect(page.locator('#ok')).toHaveText('Protected');
  expect(attempts).toHaveLength(1);
  await page.close();
});

test('Basic Auth — injection quand le cache est encore en cours de chargement', async ({ extContext: context }) => {
  // Reproduces a challenge arriving right after the service worker woke up:
  // the credentials are still being read from storage when Chrome asks for them.
  const sw = await getWorker(context);
  await sw.evaluate(() => {
    const original = chrome.storage.local.get.bind(chrome.storage.local);
    globalThis._restoreStorageGet = () => { chrome.storage.local.get = original; };
    chrome.storage.local.get = (...args) => new Promise((resolve) => setTimeout(resolve, 800)).then(() => original(...args));
  });

  const page = await context.newPage();
  try {
    await sw.evaluate((g) => chrome.storage.local.set({ groups: g }), buildGroups({ enabled: true, username: USER, password: PASS }));
    await page.goto(`http://${host}/page`, { timeout: 5000 });
    await expect(page.locator('#ok')).toHaveText('Protected');
    expect(attempts).toHaveLength(1);
  } finally {
    await sw.evaluate(() => globalThis._restoreStorageGet());
    await page.close();
  }
});

test('Basic Auth — identifiants refusés : une seule tentative, pas de boucle', async ({ extContext: context }) => {
  await setGroups(context, buildGroups({ enabled: true, username: USER, password: 'wrong' }));

  const page = await context.newPage();
  // Chrome falls back to its native prompt, so the navigation never completes
  await page.goto(`http://${host}/page`, { timeout: 2000 }).catch(() => {});
  expect(attempts).toHaveLength(1);
  await expect(page.locator('#ok')).toHaveCount(0);
  await page.close();
});

test('Basic Auth désactivé — aucun identifiant envoyé', async ({ extContext: context }) => {
  await setGroups(context, buildGroups({ enabled: false, username: USER, password: PASS }));

  const page = await context.newPage();
  await page.goto(`http://${host}/page`, { timeout: 2000 }).catch(() => {});
  expect(attempts).toHaveLength(0);
  await expect(page.locator('#ok')).toHaveCount(0);
  await page.close();
});
