// EnvJumper - https://github.com/<votre-repo>/envjump
// Copyright (C) 2026 <Votre Nom>
// Licence : GPL v3 — voir le fichier LICENSE

/**
 * Shorthand for document.getElementById.
 * @param {string} id
 * @returns {HTMLElement|null}
 */
export function el(id) {
  return document.getElementById(id);
}

/**
 * Removes the 'hidden' class from an element by its id.
 * @param {string} id
 */
export function show(id) {
  el(id).classList.remove('hidden');
}

/**
 * Adds the 'hidden' class to an element by its id.
 * @param {string} id
 */
export function hide(id) {
  el(id).classList.add('hidden');
}

/**
 * Injects Basic Auth credentials into a URL string if enabled.
 * @param {string} url
 * @param {object|null} basicAuth - { enabled, username, password }
 * @returns {string}
 */
export function injectBasicAuth(url, basicAuth) {
  if (!basicAuth || !basicAuth.enabled || !basicAuth.username) return url;
  try {
    const u = new URL(url);
    u.username = encodeURIComponent(basicAuth.username);
    u.password = encodeURIComponent(basicAuth.password || '');
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * Builds a URL by replacing the domain (and optionally protocol) of the current URL.
 * Preserves path, query string and hash.
 * If targetDomain contains a port (e.g. "localhost:3000"), it sets url.host.
 * @param {string} currentUrl
 * @param {string} targetDomain - Domain, optionally including port (e.g. "localhost:3000")
 * @param {string} [targetProtocol] - 'https' or 'http' (default: 'https')
 * @param {object|null} [basicAuth] - { enabled, username, password }
 * @returns {string|null}
 */
export function buildTargetUrl(currentUrl, targetDomain, targetProtocol = 'https', basicAuth = null) {
  try {
    const url = new URL(currentUrl);
    const proto = targetProtocol || 'https';
    url.protocol = proto + ':';
    if (targetDomain.includes(':')) {
      // Domain includes port — set both hostname and port via url.host
      url.host = targetDomain;
    } else {
      url.hostname = targetDomain;
      // Clear any existing port when switching to a domain without explicit port
      url.port = '';
    }
    return injectBasicAuth(url.toString(), basicAuth);
  } catch {
    return null;
  }
}

/**
 * Shows a custom confirmation modal and returns a Promise<boolean>.
 * @param {string} message
 * @returns {Promise<boolean>}
 */
export function confirm(message) {
  return new Promise((resolve) => {
    el('confirm-message').textContent = message;
    show('confirm-modal');

    function cleanup() {
      hide('confirm-modal');
      el('confirm-ok').removeEventListener('click', onOk);
      el('confirm-cancel').removeEventListener('click', onCancel);
    }

    function onOk() { cleanup(); resolve(true); }
    function onCancel() { cleanup(); resolve(false); }

    el('confirm-ok').addEventListener('click', onOk);
    el('confirm-cancel').addEventListener('click', onCancel);
  });
}

/**
 * Displays an import error message.
 * @param {string} msg
 */
export function showImportError(msg) {
  el('import-error').textContent = msg;
  show('import-error');
}

/**
 * Displays an import success message (auto-hides after 3 seconds).
 * @param {string} msg
 */
export function showImportSuccess(msg) {
  el('import-success').textContent = msg;
  show('import-success');
  setTimeout(() => hide('import-success'), 3000);
}

/**
 * Shows the import merge/replace modal and returns a Promise
 * that resolves to 'merge' or 'replace'.
 * @returns {Promise<'merge'|'replace'>}
 */
export function showImportModal() {
  return new Promise((resolve) => {
    show('import-modal');

    function cleanup() {
      hide('import-modal');
      el('import-merge-btn').removeEventListener('click', onMerge);
      el('import-replace-btn').removeEventListener('click', onReplace);
    }

    function onMerge() { cleanup(); resolve('merge'); }
    function onReplace() { cleanup(); resolve('replace'); }

    el('import-merge-btn').addEventListener('click', onMerge);
    el('import-replace-btn').addEventListener('click', onReplace);
  });
}
